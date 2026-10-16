"""Native Anki image-occlusion model; no live collection or profile access.

The native field tags and originalStockKind identify the stock IO machinery.
Only the existing local MathJax/Anki runtime is used; no remote scripts.
"""
import hashlib
import genanki

IO_FIELDS = ['Occlusion', 'Image', 'Header', 'Back Extra', 'Comments',
             'Topic', 'Source', 'My notes', 'premedos_concept_id',
             'premedos_source', 'premedos_spec']
IO_MODEL_ID = 895232792405
IO_MODEL_NAME = 'premedOS Image Occlusion (prompt v1)'

TOPIC = '{{#Topic}}<span class="topic-chip">{{Topic}}</span>{{/Topic}}'
SOURCE = '{{#Source}}<details class="source"><summary>Source</summary><div>{{Source}}</div></details>{{/Source}}'
MY_NOTES = '{{#My notes}}<div class="my-notes">{{My notes}}</div>{{/My notes}}'
IO_BODY = '''{{#Header}}<div class="io-header">{{Header}}</div>{{/Header}}
<div style="display: none">{{cloze:Occlusion}}</div>
<div id="err"></div>
<div id="image-occlusion-container">
{{Image}}
<canvas id="image-occlusion-canvas"></canvas>
</div>
<script>
try {
  anki.imageOcclusion.setup();
} catch (exc) {
  document.getElementById("err").textContent = "Image occlusion needs a current Anki version. Please update Anki before studying this card.";
}
</script>'''
IO_LABEL = '<div class="type card-meta"><span class="verb">recall</span>' + TOPIC + '</div>'
IO_Q = '<div class="pm m-say">' + IO_LABEL + IO_BODY + '</div>'
IO_A = ('<div class="pm m-say">' + IO_LABEL + IO_BODY
        + '<div><button id="toggle">Toggle Masks</button></div>'
        + '{{#Back Extra}}<div class="extra">{{Back Extra}}</div>{{/Back Extra}}'
        + MY_NOTES + SOURCE + '</div>')
IO_TEMPLATES = [{'name': 'Image Occlusion', 'qfmt': IO_Q, 'afmt': IO_A}]
IO_CSS = '''
#image-occlusion-container { position: relative; margin: 0 auto; max-height: calc(95vh - 40px); }
#image-occlusion-container img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; max-width: unset; max-height: unset; }
#image-occlusion-canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
#image-occlusion-canvas {
  --inactive-shape-color: #ffeba2;
  --active-shape-color: #ff8e8e;
  --inactive-shape-border: 1px #212121;
  --active-shape-border: 1px #212121;
  --highlight-shape-color: #ff8e8e00;
  --highlight-shape-border: 1px #ff8e8e;
}
'''


def _stable_id(value):
    return 1_000_000_000 + int(hashlib.sha256(value.encode()).hexdigest()[:10], 16)


class NativeImageOcclusionModel(genanki.Model):
    """Keep the native type marker omitted by genanki's ordinary model JSON."""
    def to_json(self, timestamp, deck_id):
        result = super().to_json(timestamp, deck_id)
        result['originalStockKind'] = 6
        return result


def native_model(css, model_id=None):
    """Return the final fixed-field IO model, suitable for a genanki package.

    The five stock fields carry native tags. All field/template identities are
    deterministic across builds, while CSS/template changes leave model ID alone.
    """
    if model_id is None:
        model_id = IO_MODEL_ID
    fields = []
    for index, name in enumerate(IO_FIELDS):
        field = {'name': name,
                 'id': _stable_id('premedos-io-field:' + name),
                 'preventDeletion': index < 4}
        if index < 5:
            field['tag'] = index
        fields.append(field)
    templates = [dict(template,
                      id=_stable_id('premedos-io-template:ImageOcclusion'))
                 for template in IO_TEMPLATES]
    return NativeImageOcclusionModel(
        model_id, IO_MODEL_NAME, fields=fields, templates=templates,
        css=css + IO_CSS, model_type=genanki.Model.CLOZE)


def native_occlusion(left, top, width, height):
    """One normalized rectangle, one independently reviewed native c1 mask."""
    values = (left, top, width, height)
    if any(isinstance(value, bool) or not isinstance(value, (int, float))
           or not 0 <= value <= 1 for value in values):
        raise ValueError('Occlusion rectangle coordinates must be finite numbers from 0 to 1.')
    if width <= 0 or height <= 0 or left + width > 1 or top + height > 1:
        raise ValueError('Occlusion rectangle must have positive area inside the image.')
    return ('{{c1::image-occlusion:rect:left=' + format(left, '.10g')
            + ':top=' + format(top, '.10g')
            + ':width=' + format(width, '.10g')
            + ':height=' + format(height, '.10g') + ':oi=1}}')
