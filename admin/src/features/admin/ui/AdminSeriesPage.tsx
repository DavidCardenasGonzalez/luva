import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { getAdminSeries } from '@/features/admin/api/admin-client'
import type { SeriesSummary } from '@/features/admin/model/microdramas'
import { AdminLayout } from './AdminLayout'
import './microdramas.css'

export function AdminSeriesPage() {
  const [items, setItems] = useState<SeriesSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    let cancelled = false
    void getAdminSeries().then(result => { if (!cancelled) setItems(result.items) })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'No pudimos cargar las series.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [reload])

  const visible = items.filter(item => (status === 'all' || item.publicationStatus === status)
    && `${item.title} ${item.seriesId}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()))

  return <AdminLayout title="Series" description="Crea microdramas, organiza sus episodios y elige qué historias aparecen en la app."
    actions={<><button className="btn secondary" onClick={() => { setLoading(true); setError(''); setReload(value => value + 1) }} disabled={loading}>Recargar</button><Link className="btn primary" to={appPaths.seriesNew}>Nueva serie</Link></>}>
    <section className="admin-panel series-section">
      <div className="series-toolbar">
        <label>Buscar serie<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Título o identificador" /></label>
        <label>Estado<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todas</option><option value="draft">Borradores</option><option value="published">Publicadas</option></select></label>
      </div>
      {error ? <p role="alert" className="series-error">{error}</p> : null}
      {loading ? <p role="status">Cargando series…</p> : !visible.length ? <div className="series-empty"><h2>{items.length ? 'No hay coincidencias' : 'Empieza una nueva historia'}</h2><p>{items.length ? 'Prueba otra búsqueda o estado.' : 'Crea una serie, agrega su portada y personajes y sube los primeros episodios.'}</p>{!items.length && !error ? <Link className="btn" to={appPaths.seriesNew}>Crear primera serie</Link> : null}</div> : <div className="series-catalog">
        {visible.map(item => <article className="series-catalog-card" key={item.seriesId}>
          {item.coverUrl ? <img src={item.coverUrl} alt={`Portada de ${item.title}`} /> : <div className="series-cover-empty">Sin portada</div>}
          <div><span className={`series-status ${item.publicationStatus}`}>{item.publicationStatus === 'published' ? 'Publicada' : 'Borrador'}</span><h2>{item.title}</h2><p>{item.synopsis || 'Sin sinopsis todavía.'}</p><p className="series-muted">{item.episodeCount} publicados · {item.totalEpisodeCount} episodios · Orden {item.catalogOrder}</p><Link className="btn secondary" to={appPaths.seriesEditor(item.seriesId)}>Editar serie</Link></div>
        </article>)}
      </div>}
    </section>
  </AdminLayout>
}
