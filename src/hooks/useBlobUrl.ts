import { useEffect, useState } from 'react'
import { getFile, isIdb, StoredFile } from '../services/files'
/** Mengubah referensi `idb:<id>` menjadi object URL; URL biasa dikembalikan apa adanya. */
export function useBlobUrl(ref: string) {
  const [url, setUrl] = useState(''), [meta, setMeta] = useState<StoredFile | null | undefined>(undefined)
  useEffect(() => {
    if (!isIdb(ref)) { setUrl(ref); setMeta(undefined); return }
    let u = '', live = true
    getFile(ref).then((f) => { if (!live) return; if (f) { u = URL.createObjectURL(f.blob); setUrl(u); setMeta(f) } else setMeta(null) }).catch(() => live && setMeta(null))
    return () => { live = false; if (u) URL.revokeObjectURL(u) }
  }, [ref])
  return { url, meta }
}
