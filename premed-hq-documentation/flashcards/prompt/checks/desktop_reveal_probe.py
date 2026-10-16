"""Opt-in native Anki reviewer probe; never opens an existing profile.

Usage: python desktop_reveal_probe.py --package sample.apkg --report sample.build-report.json
       --work-dir NEW_EMPTY_DIRECTORY [--app /Applications/Anki.app/Contents/MacOS/Anki]
The caller must inspect result.json. DOM-only tests cannot substitute for this check.
"""
import argparse
import json
import os
from pathlib import Path
import pickle
import sqlite3
import subprocess
import time
import uuid

ADDON = r'''
from aqt import mw, gui_hooks
from aqt.qt import QTimer
from anki.collection import ImportAnkiPackageRequest, ImportAnkiPackageOptions
from pathlib import Path
import anki,json,traceback
OUT=Path(__file__).resolve().parents[3]
CONFIG=json.loads((OUT/'config.json').read_text())
results={'version':anki.version,'cases':[],'passed':False,'profile':'Feature Test','liveProfileTouched':False}

def finish(error=None):
 if error: results['error']=error
 results['passed']=not error
 (OUT/'result.json').write_text(json.dumps(results,indent=2))
 QTimer.singleShot(100,lambda:mw.unloadProfileAndExit())

def guarded(fn):
 def call(*args):
  try: return fn(*args)
  except: finish(traceback.format_exc())
 return call

def later(fn): QTimer.singleShot(700,guarded(fn))
def query(callback):
 mw.web.evalWithCallback("JSON.stringify({button:!!document.querySelector('.pm-list-reveal'),texts:Array.from(document.querySelectorAll('#pm-list-question .cloze')).map(x=>x.textContent),revealed:document.querySelectorAll('.pm-list-revealed').length,disabled:document.querySelector('.pm-list-reveal')?.disabled,question:document.getElementById('pm-list-question')?.textContent,chip:(()=>{let e=document.querySelector('.topic-chip');if(!e)return null;let c=getComputedStyle(e);return {display:c.display,font:c.fontFamily,size:c.fontSize,padding:c.padding,background:c.backgroundColor,color:c.color}})()})",guarded(lambda raw:QTimer.singleShot(200,guarded(lambda:callback(json.loads(raw))))))

def show(note_id,done):
 ids=mw.col.find_cards('')
 cid=next(c for c in ids if mw.col.get_card(c).note().guid==guids[note_id] and mw.col.get_card(c).ord==0)
 mw.moveToState('deckBrowser')
 mw.col.sched.unsuspend_cards(ids)
 mw.col.sched.suspend_cards([c for c in ids if c!=cid])
 mw.col.decks.select(mw.col.get_card(cid).did)
 later(lambda:(mw.moveToState('review'),later(done)))

def record(name,value):
 assert mw.state=='review',mw.state
 results['cases'].append({'name':name,**value})
 mw.web.grab().save(str(OUT/(name+'.png')))

def stale(value):
 record('stale-list-only-template',value)
 assert not value['button'] and len(value['texts'])==2,value
 # Exercise the real package-import template upgrade, not a direct DOM patch.
 mw.moveToState('deckBrowser')
 import_current()
 later(lambda:show('opposite-pair',lambda:query(upgraded)))

def upgraded(value):
 record('opposite-pair-upgraded',value)
 assert value['button'] and len(value['texts'])==2 and value['revealed']==0,value
 check_reveals('opposite-pair',2,lambda:show('drive',lambda:query(single)))

def check_reveals(name,count,done,index=1):
 mw.web.eval("document.querySelector('.pm-list-reveal').click()")
 def checked(value):
  record(name+'-reveal-'+str(index),value)
  assert value['revealed']==index,value
  assert value['disabled']==(index==count),value
  if index<count:check_reveals(name,count,done,index+1)
  else:
   mw.reviewer._showAnswer()
   later(lambda:mw.web.evalWithCallback("!!document.querySelector('.pm-list-reveal')",guarded(lambda exists:after_answer(exists,done))))
 query(checked)

def after_answer(exists,done):
 assert not exists,'reveal control leaked onto answer'
 done()

def single(value):
 record('single-blank',value)
 assert not value['button'] and len(value['texts'])==1,value
 next_group()

groups=[]
singles=[]
def next_group():
 if not groups:
  if singles:
   note=singles.pop(0)
   def checked_single(value):
    record(note+'-single',value)
    assert not value['button'] and len(value['texts'])==1,value
    next_group()
   show(note,lambda:query(checked_single));return
  show('opposite-pair',lambda:query(returned));return
 note,count=groups.pop(0)
 def initial(value):
  record(note+'-initial',value)
  assert value['button'] and len(value['texts'])==count and value['revealed']==0,value
  if note=='intrinsic-extrinsic-names':assert value['chip']['display']=='none',value
  check_reveals(note,count,next_group)
 show(note,lambda:query(initial))

def returned(value):
 record('opposite-pair-after-transitions',value)
 assert value['button'] and value['revealed']==0,value
 finish()

def import_current():
 mw.col.import_anki_package(ImportAnkiPackageRequest(package_path=CONFIG['package'],options=ImportAnkiPackageOptions(update_notes=1,update_notetypes=1,merge_notetypes=True,with_scheduling=False,with_deck_configs=False)))

@guarded
def start():
 global guids,groups,singles
 assert Path(mw.pm.base).resolve()==(OUT/'base').resolve(),mw.pm.base
 assert not mw.col.find_notes(''),'probe requires a fresh collection'
 guids={r['id']:r['guid'] for r in json.loads(Path(CONFIG['report']).read_text())['records']}
 import_current()
 note=next(mw.col.get_note(n) for n in mw.col.find_notes('') if mw.col.get_note(n).guid==guids['opposite-pair'])
 model=note.note_type()
 q=model['tmpls'][0]['qfmt']
 marker="if (!root) return;"
 assert marker in q,'cannot simulate legacy gate'
 model['tmpls'][0]['qfmt']=q.replace(marker,marker+" if (root.querySelector('.verb').textContent.trim() !== 'list') return;")
 mw.col.models.update_dict(model)
 # Test the existing list plus optional 3/4-term meaning fixtures supplied by caller.
 groups=[('components',3)]+[(name,count) for name,count in CONFIG['groups'] if name in guids]
 singles=[name for name in CONFIG.get('singles',[]) if name in guids]
 show('opposite-pair',lambda:query(stale))

gui_hooks.profile_did_open.append(lambda:later(start))
'''


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--package',required=True,type=Path)
    parser.add_argument('--report',required=True,type=Path)
    parser.add_argument('--work-dir',required=True,type=Path)
    parser.add_argument('--app',type=Path,default=Path('/Applications/Anki.app/Contents/MacOS/Anki'))
    parser.add_argument('--group',action='append',default=[],help='note-id:blank-count')
    parser.add_argument('--single',action='append',default=[],help='single-blank note ID to check in the native reviewer')
    args=parser.parse_args()
    work=args.work_dir.resolve()
    work.mkdir(parents=True,exist_ok=False)
    base=work/'base'
    addon=base/'addons21'/'premedos_reveal_probe'
    addon.mkdir(parents=True)
    (addon/'__init__.py').write_text(ADDON)
    (work/'config.json').write_text(json.dumps({'package':str(args.package.resolve()),'report':str(args.report.resolve()),'groups':[(x.rsplit(':',1)[0],int(x.rsplit(':',1)[1])) for x in args.group],'singles':args.single}))
    now=int(time.time())
    meta=dict(ver=0,updates=False,created=now,id=123456781231,lastMsg=0,suppressUpdate=True,firstRun=False,defaultLang='en_US')
    profile=dict(mainWindowGeom=None,mainWindowState=None,numBackups=0,lastOptimize=now,searchHistory=[],syncKey=None,syncMedia=False,autoSync=False,lastColour='#00f',stripHTML=True,deleteMedia=False,allowHTML=False,importMode=1)
    with sqlite3.connect(base/'prefs21.db') as db:
        db.execute('create table profiles(name text primary key collate nocase,data blob not null)')
        db.executemany('insert into profiles values (?,?)',[(n,pickle.dumps(v,protocol=4)) for n,v in [('_global',meta),('Feature Test',profile)]])
    env={**os.environ,'ANKI_SINGLE_INSTANCE_KEY':'premedos-probe-'+uuid.uuid4().hex}
    with (work/'desktop.log').open('w') as log:
        proc=subprocess.Popen([str(args.app),'-b',str(base),'-p','Feature Test','-l','en'],env=env,stdout=log,stderr=subprocess.STDOUT)
        try: proc.wait(timeout=100)
        except subprocess.TimeoutExpired:
            proc.terminate();proc.wait(timeout=10)
            raise SystemExit('Native probe timed out; inspect '+str(work/'desktop.log'))
    result=json.loads((work/'result.json').read_text())
    print(json.dumps({'version':result['version'],'passed':result['passed'],'cases':len(result['cases']),'receipt':str(work/'result.json')}))
    if not result['passed']:raise SystemExit(result.get('error','native probe failed'))

if __name__=='__main__': main()
