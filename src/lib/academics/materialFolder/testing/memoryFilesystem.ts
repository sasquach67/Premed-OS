import type { DirectoryHandle, FileHandle } from '../filesystem'

export class MemoryFile implements FileHandle {
  kind = 'file' as const
  file: File
  failClose = false
  onWrite?: () => void
  reads = 0
  name: string
  constructor(name: string, content: string | Blob, modified = 123) { this.name = name; this.file = new File([content], name, { lastModified: modified, type: 'text/plain' }) }
  async getFile() { return this.file }
  async createWritable() {
    let next = this.file
    return {
      write: async (data: Blob | string) => { next = new File([data], this.name, { lastModified: Date.now(), type: typeof data === 'string' ? 'text/plain' : data.type }); this.onWrite?.() },
      close: async () => { if (this.failClose) throw new Error('Disk full'); this.file = next },
      abort: async () => {},
    }
  }
}
export class MemoryDirectory implements DirectoryHandle {
  kind = 'directory' as const
  children = new Map<string, MemoryFile | MemoryDirectory>()
  granted = true
  name: string
  constructor(name = 'Lesson 01') { this.name = name }
  async *values() { yield* this.children.values() }
  async queryPermission() { return this.granted ? 'granted' as const : 'denied' as const }
  async requestPermission() { return this.queryPermission() }
  async isSameEntry(other: DirectoryHandle) { return other === this }
  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    let value = this.children.get(name)
    if (!value && options?.create) { value = new MemoryDirectory(name); this.children.set(name, value) }
    if (!value) throw new DOMException('Missing', 'NotFoundError')
    if (value.kind !== 'directory') throw new DOMException('Not a folder', 'TypeMismatchError')
    return value
  }
  async getFileHandle(name: string, options?: { create?: boolean }) {
    let value = this.children.get(name)
    if (!value && options?.create) { value = new MemoryFile(name, ''); this.children.set(name, value) }
    if (!value) throw new DOMException('Missing', 'NotFoundError')
    if (value.kind !== 'file') throw new DOMException('Not a file', 'TypeMismatchError')
    return value
  }
  async removeEntry(name: string) {
    if (!this.children.has(name)) throw new DOMException('Missing', 'NotFoundError')
    this.children.delete(name)
  }
  file(name: string, content = 'source bytes') { const file = new MemoryFile(name, content); this.children.set(name, file); return file }
  dir(name: string) { const dir = new MemoryDirectory(name); this.children.set(name, dir); return dir }
}
