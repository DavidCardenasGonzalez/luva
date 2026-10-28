import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { createAdminAssetUpload, deleteAdminSeries, getAdminSeriesDetail, getAdminStoryCharacters, saveAdminSeries } from '@/features/admin/api/admin-client'
import type { SeriesEpisode, SeriesManifest, SeriesStatus } from '@/features/admin/model/microdramas'
import type { AdminAssetFolder, AdminStoryCharacter } from '@/features/admin/model/types'
import { AdminLayout } from './AdminLayout'
import './microdramas.css'

function emptyManifest(): SeriesManifest {
  return { series: { seriesId: '', title: '', synopsis: '', coverUrl: '', chatCharacterIds: [], catalogOrder: 0, publicationStatus: 'draft' }, episodes: [] }
}

function slug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const element = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    const cleanup = () => { clearTimeout(timeout); element.removeAttribute('src'); element.load(); URL.revokeObjectURL(objectUrl) }
    const timeout = setTimeout(() => { cleanup(); reject(new Error('No pudimos leer la duración. Usa un video MP4 compatible o indica su URL y duración.')) }, 15000)
    element.preload = 'metadata'
    element.onloadedmetadata = () => {
      const duration = Math.round(element.duration * 1000)
      element.onloadedmetadata = null
      element.onerror = null
      cleanup()
      if (Number.isSafeInteger(duration) && duration > 0) resolve(duration)
      else reject(new Error('El video no tiene una duración válida.'))
    }
    element.onerror = () => { element.onerror = null; cleanup(); reject(new Error('No pudimos leer este video. Usa MP4 compatible o indica su URL y duración.')) }
    element.src = objectUrl
  })
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No pudimos optimizar la portada.')), 'image/webp', quality)
  })
}

async function optimizeCover(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('No pudimos leer la portada seleccionada.'))
      element.src = objectUrl
    })
    // Match the series-card ratio so the feed does not download pixels it will crop away.
    const width = 480
    const height = 682
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No pudimos preparar el optimizador de portada.')
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
    const sourceWidth = width / scale
    const sourceHeight = height / scale
    const sourceX = (image.naturalWidth - sourceWidth) / 2
    const sourceY = (image.naturalHeight - sourceHeight) / 2
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)
    return await canvasToWebp(canvas, 0.78)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function FileInput({ label, accept, onFile }: { label: string; accept: string; onFile: (file: File) => void }) {
  return <label className="series-file">{label}<input type="file" accept={accept} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) onFile(file) }} /></label>
}

export function AdminSeriesEditorPage() {
  const { seriesId } = useParams<{ seriesId: string }>()
  const navigate = useNavigate()
  const [manifest, setManifest] = useState<SeriesManifest>(emptyManifest)
  const [version, setVersion] = useState(0)
  const [characters, setCharacters] = useState<AdminStoryCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState('')
  const [dirty, setDirty] = useState(false)
  const [manualId, setManualId] = useState(false)
  const [characterSearch, setCharacterSearch] = useState('')
  const [expandedEpisodes, setExpandedEpisodes] = useState<string[]>([])
  const [reload, setReload] = useState(0)
  const uploadController = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    void Promise.all([seriesId ? getAdminSeriesDetail(seriesId) : Promise.resolve(undefined), getAdminStoryCharacters()])
      .then(([detail, people]) => {
        if (cancelled) return
        setManifest(detail?.manifest || emptyManifest())
        setVersion(detail?.version || 0)
        setCharacters(people.characters)
        setManualId(Boolean(detail))
        setExpandedEpisodes([])
        setDirty(false)
      }).catch(err => { if (!cancelled) setLoadError(err instanceof Error ? err.message : 'No pudimos cargar la serie.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; uploadController.current?.abort() }
  }, [seriesId, reload])

  useEffect(() => {
    if (!dirty && !uploading) return
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const beforeNavigate = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest('a') : null
      if (!anchor || anchor.target === '_blank' || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      if (!window.confirm('Hay cambios sin guardar. ¿Quieres salir de la serie?')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', beforeNavigate, true)
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', beforeNavigate, true) }
  }, [dirty, uploading])

  const changeSeries = (patch: Partial<SeriesManifest['series']>) => {
    setManifest(current => ({ ...current, series: { ...current.series, ...patch } }))
    setDirty(true)
    setMessage('')
  }
  const changeEpisode = (episodeId: string, patch: Partial<SeriesEpisode>) => {
    setManifest(current => ({ ...current, episodes: current.episodes.map(episode => episode.episodeId === episodeId ? { ...episode, ...patch } : episode) }))
    setDirty(true)
    setMessage('')
  }
  const reorder = (index: number, offset: number) => {
    const episodes = [...manifest.episodes]
    const target = index + offset
    if (target < 0 || target >= episodes.length) return
    ;[episodes[index], episodes[target]] = [episodes[target], episodes[index]]
    setManifest(current => ({ ...current, episodes: episodes.map((episode, i) => ({ ...episode, episodeNumber: i + 1 })) }))
    setDirty(true)
  }

  const upload = async (kind: 'cover' | 'video' | 'subtitles', file: File, episodeId?: string) => {
    const limits = { cover: 10, video: 500, subtitles: 2 }
    if (file.size > limits[kind] * 1024 * 1024) { setError(`El archivo supera el límite de ${limits[kind]} MB.`); return }
    const controller = new AbortController()
    uploadController.current = controller
    setUploading(`Subiendo ${file.name}…`)
    setError('')
    setMessage('')
    try {
      let durationMs = 0
      if (kind === 'video') durationMs = await readVideoDuration(file)
      if (kind === 'subtitles') {
        const content = await file.text()
        if (!/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(content)) throw new Error('El archivo debe ser un SRT válido con marcas de tiempo.')
      }
      if (controller.signal.aborted) return
      const folders: Record<typeof kind, AdminAssetFolder> = { cover: 'microdramaCovers', video: 'microdramaVideos', subtitles: 'microdramaSubtitles' }
      const uploadFile = kind === 'cover' ? await optimizeCover(file) : file
      if (controller.signal.aborted) return
      const contentType = kind === 'cover' ? 'image/webp' : kind === 'subtitles' ? 'application/x-subrip' : file.type
      const fileName = kind === 'cover' ? `${slug(file.name.replace(/\.[^.]+$/, '')) || 'series-cover'}-optimized.webp` : file.name
      if (kind === 'cover') setUploading(`Subiendo portada optimizada (${Math.round(uploadFile.size / 1024)} KB)…`)
      const target = await createAdminAssetUpload(folders[kind], contentType, fileName)
      const response = await fetch(target.uploadUrl, { method: 'PUT', headers: { 'Content-Type': target.contentType, 'Cache-Control': target.cacheControl }, body: uploadFile, signal: controller.signal })
      if (!response.ok) throw new Error(`No pudimos subir el archivo (HTTP ${response.status}).`)
      if (kind === 'cover') changeSeries({ coverUrl: target.url })
      else if (episodeId) changeEpisode(episodeId, kind === 'video' ? { videoUrl: target.url, durationMs } : { subtitlesUrl: target.url })
      setMessage('Archivo subido. Guarda la serie para aplicar el cambio.')
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'No pudimos subir el archivo.')
    } finally { if (!controller.signal.aborted) setUploading('') }
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await saveAdminSeries(manifest, version)
      setManifest(result.manifest)
      setVersion(result.version)
      setDirty(false)
      setMessage(result.manifest.series.publicationStatus === 'published' ? 'Serie guardada y publicada en la app.' : 'Borrador guardado. La serie no está visible en la app.')
      if (!seriesId) navigate(appPaths.seriesEditor(result.manifest.series.seriesId), { replace: true })
    } catch (err) { setError(err instanceof Error ? err.message : 'No pudimos guardar la serie.') }
    finally { setBusy(false) }
  }

  const remove = async () => {
    if (!seriesId || !window.confirm(`¿Eliminar la serie «${manifest.series.title}» y sus episodios? Los archivos subidos no se borrarán.`)) return
    setBusy(true)
    setError('')
    try { await deleteAdminSeries(seriesId, version); setDirty(false); navigate(appPaths.series) }
    catch (err) { setError(err instanceof Error ? err.message : 'No pudimos eliminar la serie.'); setBusy(false) }
  }

  const series = manifest.series
  const publishedCount = manifest.episodes.filter(episode => episode.publicationStatus === 'published').length
  const visibleCharacters = characters.filter(character => `${character.characterName} ${character.characterId}`.toLocaleLowerCase().includes(characterSearch.toLocaleLowerCase().trim()))

  return <AdminLayout title={seriesId ? 'Editar serie' : 'Nueva serie'} description="Prepara la historia, selecciona sus personajes y organiza los episodios del microdrama."
    actions={<><button className="btn secondary" type="button" disabled={loading || busy || Boolean(uploading)} onClick={() => { if (!dirty || window.confirm('¿Recargar y descartar los cambios sin guardar?')) { setError(''); setMessage(''); setReload(value => value + 1) } }}>Recargar</button><Link className="btn secondary" to={appPaths.series}>Volver a series</Link></>}>
    {loading ? <section className="admin-panel"><p role="status">Cargando editor…</p></section> : loadError ? <section className="admin-panel"><p role="alert" className="series-error">{loadError}</p><button className="btn secondary" onClick={() => setReload(value => value + 1)}>Reintentar</button></section> : <form className="series-form" onSubmit={event => void save(event)}>
      {error ? <p role="alert" className="series-error">{error}</p> : null}
      {message ? <p role="status" className="series-success">{message}</p> : null}
      {uploading ? <p role="status" className="series-notice">{uploading}</p> : null}
      <fieldset disabled={busy || Boolean(uploading)}>
        <div className="series-editor-grid">
          <section className="admin-panel series-section"><h2>Datos de la serie</h2>
            <label>Título<input required maxLength={120} value={series.title} onChange={event => { const title = event.target.value; changeSeries({ title, ...(!seriesId && !manualId ? { seriesId: slug(title) } : {}) }) }} /></label>
            <label>Identificador<input required pattern="[a-z0-9][a-z0-9_\-]{0,79}" maxLength={80} value={series.seriesId} disabled={Boolean(seriesId)} onChange={event => { setManualId(true); changeSeries({ seriesId: event.target.value }) }} /><small>Único y permanente. Usa minúsculas, números y guiones.</small></label>
            <label>Sinopsis<textarea rows={4} maxLength={500} value={series.synopsis} onChange={event => changeSeries({ synopsis: event.target.value })} /><small>{series.synopsis.length}/500 caracteres. Evita spoilers.</small></label>
            <label>URL de portada<input type="url" placeholder="https://…" value={series.coverUrl} onChange={event => changeSeries({ coverUrl: event.target.value })} /></label>
            <FileInput label="Subir portada (hasta 10 MB)" accept="image/jpeg,image/png,image/webp,image/avif" onFile={file => void upload('cover', file)} />
            {series.coverUrl ? <img className="series-cover-preview" src={series.coverUrl} alt="Vista previa de portada" /> : null}
          </section>
          <aside className="series-sidebar">
            <section className="admin-panel series-section"><h2>Publicación</h2>
              <label>Estado de la serie<select value={series.publicationStatus} onChange={event => changeSeries({ publicationStatus: event.target.value as SeriesStatus })}><option value="draft">Borrador · Oculta en la app</option><option value="published">Publicada · Visible en la app</option></select></label>
              <label>Orden en el catálogo<input type="number" min={0} max={99999999} step={1} required value={series.catalogOrder} onChange={event => changeSeries({ catalogOrder: Number(event.target.value) })} /><small>El número menor aparece primero.</small></label>
              <p className="series-muted">{publishedCount} {publishedCount === 1 ? 'publicado' : 'publicados'} de {manifest.episodes.length} {manifest.episodes.length === 1 ? 'episodio' : 'episodios'}.</p>
              <p className="series-muted">Para publicar necesitas portada, sinopsis, al menos un personaje y un episodio publicado con video y duración. Puedes preparar episodios futuros como borrador.</p>
              <button className="btn primary" type="submit">{busy ? 'Guardando…' : 'Guardar serie'}</button>
              <span className="series-muted">{dirty ? 'Hay cambios sin guardar.' : version ? 'Cambios guardados.' : 'Nueva serie sin guardar.'}</span>
            </section>
            <section className="admin-panel series-section"><h2>Personajes para conversar</h2><p className="series-muted">Elige de uno a cinco personajes existentes. Se mostrarán en el reproductor.</p>
              <label>Buscar personaje<input type="search" value={characterSearch} onChange={event => setCharacterSearch(event.target.value)} placeholder="Nombre o identificador" /></label>
              <div className="series-character-list">{visibleCharacters.map(character => {
                const selected = series.chatCharacterIds.includes(character.characterId)
                return <label className="series-character" key={character.characterId}><input type="checkbox" checked={selected} disabled={!selected && series.chatCharacterIds.length >= 5} onChange={() => changeSeries({ chatCharacterIds: selected ? series.chatCharacterIds.filter(id => id !== character.characterId) : [...series.chatCharacterIds, character.characterId] })} />{character.avatarImageXsUrl || character.avatarImageUrl ? <img alt="" src={character.avatarImageXsUrl || character.avatarImageUrl} /> : null}<span>{character.characterName}<small>{character.characterId}</small></span></label>
              })}</div>
              <p className="series-muted">{series.chatCharacterIds.length}/5 seleccionados.</p><Link to={appPaths.characters} target="_blank" rel="noreferrer">Administrar personajes ↗</Link>
            </section>
          </aside>
        </div>
        <section className="admin-panel series-section"><div className="series-toolbar"><div><h2>Episodios</h2><p className="series-muted">Sube archivos o utiliza URLs existentes. Los subtítulos SRT en inglés son opcionales.</p></div><button className="btn secondary" type="button" disabled={manifest.episodes.length >= 99} onClick={() => {
          const episode: SeriesEpisode = { episodeId: `ep-${crypto.randomUUID()}`, episodeNumber: manifest.episodes.length + 1, title: `Episodio ${manifest.episodes.length + 1}`, durationMs: 0, videoUrl: '', publicationStatus: 'draft' }
          setManifest(current => ({ ...current, episodes: [...current.episodes, episode] })); setDirty(true)
          setExpandedEpisodes(current => [...current, episode.episodeId])
        }}>Agregar episodio</button></div>
          {!manifest.episodes.length ? <p className="series-empty">Todavía no hay episodios. Puedes guardar la serie como borrador y agregarlos después.</p> : null}
          {manifest.episodes.map((episode, index) => <details className="series-episode" key={episode.episodeId} open={expandedEpisodes.includes(episode.episodeId)} onToggle={event => {
            const open = event.currentTarget.open
            setExpandedEpisodes(current => current.includes(episode.episodeId) === open ? current : open ? [...current, episode.episodeId] : current.filter(id => id !== episode.episodeId))
          }}>
            <summary><span>{episode.episodeNumber}. {episode.title}</span><span className={`series-status ${episode.publicationStatus}`}>{episode.publicationStatus === 'published' ? 'Publicado' : 'Borrador'}</span></summary>
            <div className="series-episode-body">
              <div className="series-toolbar"><small className="series-muted">{episode.episodeId}</small><div className="series-actions"><button type="button" className="btn ghost" disabled={index === 0} onClick={() => reorder(index, -1)} aria-label={`Subir episodio ${episode.episodeNumber}`}>↑ Subir</button><button type="button" className="btn ghost" disabled={index === manifest.episodes.length - 1} onClick={() => reorder(index, 1)} aria-label={`Bajar episodio ${episode.episodeNumber}`}>↓ Bajar</button><button type="button" className="btn ghost" onClick={() => {
                if (!window.confirm(`¿Quitar «${episode.title}» de la serie al guardar?`)) return
                setManifest(current => ({ ...current, episodes: current.episodes.filter(item => item.episodeId !== episode.episodeId).map((item, i) => ({ ...item, episodeNumber: i + 1 })) })); setDirty(true)
              }}>Quitar</button></div></div>
              <div className="series-fields"><label>Título del episodio<input required maxLength={120} value={episode.title} onChange={event => changeEpisode(episode.episodeId, { title: event.target.value })} /></label><label>Estado<select value={episode.publicationStatus} onChange={event => changeEpisode(episode.episodeId, { publicationStatus: event.target.value as SeriesStatus })}><option value="draft">Borrador</option><option value="published">Publicado</option></select></label></div>
              <label>URL del video<input type="url" placeholder="https://…" value={episode.videoUrl} onChange={event => changeEpisode(episode.episodeId, { videoUrl: event.target.value, durationMs: 0 })} /></label>
              <FileInput label="Subir video (MP4 recomendado, hasta 500 MB)" accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/mpeg" onFile={file => void upload('video', file, episode.episodeId)} />
              <label>Duración en segundos<input type="number" min={0} step={0.001} value={episode.durationMs / 1000} onChange={event => changeEpisode(episode.episodeId, { durationMs: Math.round(Number(event.target.value) * 1000) })} /><small>Se detecta al subir el video. Puedes corregirla manualmente.</small></label>
              {episode.videoUrl ? <video className="series-video-preview" key={episode.videoUrl} controls preload="metadata" src={episode.videoUrl} onLoadedMetadata={event => { const duration = Math.round(event.currentTarget.duration * 1000); if (!episode.durationMs && Number.isSafeInteger(duration) && duration > 0) changeEpisode(episode.episodeId, { durationMs: duration }) }} /> : null}
              <label>URL de subtítulos (SRT, opcional)<input type="url" placeholder="https://…" value={episode.subtitlesUrl || ''} onChange={event => changeEpisode(episode.episodeId, { subtitlesUrl: event.target.value || undefined })} /></label>
              <FileInput label="Subir subtítulos SRT en inglés (hasta 2 MB)" accept=".srt,application/x-subrip" onFile={file => void upload('subtitles', file, episode.episodeId)} />
              {episode.subtitlesUrl ? <div className="series-actions"><a href={episode.subtitlesUrl} target="_blank" rel="noreferrer">Ver subtítulos ↗</a><button type="button" className="btn ghost" onClick={() => changeEpisode(episode.episodeId, { subtitlesUrl: undefined })}>Quitar subtítulos</button></div> : <small className="series-muted">Este episodio se reproducirá sin subtítulos.</small>}
            </div>
          </details>)}
        </section>
        <div className="series-save-bar"><button className="btn" type="submit">{busy ? 'Guardando…' : 'Guardar serie'}</button><span className="series-muted">{dirty ? 'Cambios pendientes' : ''}</span>{seriesId ? <button type="button" className="btn ghost" disabled={series.publicationStatus !== 'draft' || dirty} title="Guarda la serie como borrador antes de eliminarla." onClick={() => void remove()}>Eliminar serie</button> : null}</div>
      </fieldset>
    </form>}
  </AdminLayout>
}
