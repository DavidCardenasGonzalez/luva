import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import {
  getAdminCharacterPosts,
  getAdminStoryCharacters,
  updateAdminCharacterPost,
} from '@/features/admin/api/admin-client'
import type { AdminCharacterPost, AdminStoryCharacter } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

type PostWithCharacter = AdminCharacterPost & {
  character: AdminStoryCharacter
}

type SortField = 'order' | 'likeCount' | 'playCount' | 'watched3sCount' | 'conversationCount' | 'messageCount' | 'updatedAt'
type SortDir = 'asc' | 'desc'

type InlineEditState = {
  postId: string
  caption: string
  context: string
  conversationNarration: string
  initialMessage: string
  suggestedReplies: [string, string, string]
}

function formatNumber(value?: number) {
  if (value === undefined || value === null) return '—'
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

function getEngagementRate(post: AdminCharacterPost) {
  const plays = post.playCount ?? 0
  const convs = post.conversationCount ?? 0
  if (plays === 0) return null
  return ((convs / plays) * 100).toFixed(1)
}

function sortPosts(posts: PostWithCharacter[], field: SortField, dir: SortDir) {
  return [...posts].sort((a, b) => {
    let av: number | string
    let bv: number | string
    if (field === 'updatedAt') {
      av = a.updatedAt ?? ''
      bv = b.updatedAt ?? ''
    } else if (field === 'order') {
      av = a.order
      bv = b.order
    } else {
      av = a[field] ?? 0
      bv = b[field] ?? 0
    }
    if (av < bv) return dir === 'asc' ? -1 : 1
    if (av > bv) return dir === 'asc' ? 1 : -1
    return 0
  })
}

type LoadState = 'idle' | 'loading-characters' | 'loading-posts' | 'done' | 'error'

export function AdminAllCharacterPostsPage() {
  const navigate = useNavigate()
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [loadError, setLoadError] = useState<string>()
  const [loadProgress, setLoadProgress] = useState<{ done: number; total: number }>()
  const [allPosts, setAllPosts] = useState<PostWithCharacter[]>([])
  const [search, setSearch] = useState('')
  const [filterCharacter, setFilterCharacter] = useState('')
  const [filterMedia, setFilterMedia] = useState<'all' | 'image' | 'video'>('all')
  const [sortField, setSortField] = useState<SortField>('playCount')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [editState, setEditState] = useState<InlineEditState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const [saveSuccess, setSaveSuccess] = useState<string>()
  const abortRef = useRef<AbortController | null>(null)

  const loadAll = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoadState('loading-characters')
    setLoadError(undefined)
    setLoadProgress(undefined)

    try {
      const charactersData = await getAdminStoryCharacters()
      if (controller.signal.aborted) return

      const characters = charactersData.characters
      setLoadState('loading-posts')
      setLoadProgress({ done: 0, total: characters.length })

      const collected: PostWithCharacter[] = []
      for (let i = 0; i < characters.length; i++) {
        if (controller.signal.aborted) return
        const character = characters[i]
        try {
          const postsData = await getAdminCharacterPosts(character.characterId)
          for (const post of postsData.posts) {
            collected.push({ ...post, character })
          }
        } catch {
          // skip characters that fail to load
        }
        setLoadProgress({ done: i + 1, total: characters.length })
      }

      if (controller.signal.aborted) return
      setAllPosts(collected)
      setLoadState('done')
    } catch (error) {
      if (controller.signal.aborted) return
      setLoadError(error instanceof Error ? error.message : 'No pudimos cargar los posts.')
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    void loadAll()
    return () => {
      abortRef.current?.abort()
    }
  }, [loadAll])

  const characters = useMemo(() => {
    const seen = new Map<string, AdminStoryCharacter>()
    for (const post of allPosts) {
      if (!seen.has(post.characterId)) seen.set(post.characterId, post.character)
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.characterName.localeCompare(b.characterName),
    )
  }, [allPosts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let result = allPosts

    if (filterCharacter) {
      result = result.filter((p) => p.characterId === filterCharacter)
    }
    if (filterMedia !== 'all') {
      result = result.filter((p) => (filterMedia === 'video' ? !!p.videoUrl : !p.videoUrl))
    }
    if (q) {
      result = result.filter(
        (p) =>
          p.caption.toLowerCase().includes(q) ||
          p.characterName.toLowerCase().includes(q) ||
          (p.context ?? '').toLowerCase().includes(q) ||
          (p.initialMessage ?? '').toLowerCase().includes(q),
      )
    }

    return sortPosts(result, sortField, sortDir)
  }, [allPosts, search, filterCharacter, filterMedia, sortField, sortDir])

  const stats = useMemo(() => {
    const totalLikes = allPosts.reduce((s, p) => s + (p.likeCount ?? 0), 0)
    const totalPlays = allPosts.reduce((s, p) => s + (p.playCount ?? 0), 0)
    const totalConvs = allPosts.reduce((s, p) => s + (p.conversationCount ?? 0), 0)
    const totalMsgs = allPosts.reduce((s, p) => s + (p.messageCount ?? 0), 0)
    const videoPosts = allPosts.filter((p) => p.videoUrl).length
    return { totalLikes, totalPlays, totalConvs, totalMsgs, videoPosts }
  }, [allPosts])

  function handleSortClick(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  function openEdit(post: PostWithCharacter) {
    const replies = [...(post.suggestedReplies ?? [])]
    while (replies.length < 3) replies.push('')
    setEditState({
      postId: post.postId,
      caption: post.caption,
      context: post.context ?? '',
      conversationNarration: post.conversationNarration ?? '',
      initialMessage: post.initialMessage ?? '',
      suggestedReplies: [replies[0] ?? '', replies[1] ?? '', replies[2] ?? ''],
    })
    setSaveError(undefined)
    setSaveSuccess(undefined)
  }

  function closeEdit() {
    if (isSaving) return
    setEditState(null)
    setSaveError(undefined)
    setSaveSuccess(undefined)
  }

  async function handleSaveEdit() {
    if (!editState || isSaving) return
    const post = allPosts.find((p) => p.postId === editState.postId)
    if (!post) return

    setIsSaving(true)
    setSaveError(undefined)
    setSaveSuccess(undefined)
    try {
      await updateAdminCharacterPost(post.characterId, {
        postId: editState.postId,
        caption: editState.caption.trim(),
        context: editState.context.trim(),
        conversationNarration: editState.conversationNarration.trim(),
        initialMessage: editState.initialMessage.trim(),
        imageUrl: post.imageUrl,
        ...(post.thumbnailUrl ? { thumbnailUrl: post.thumbnailUrl } : {}),
        ...(post.thumbnailMdUrl ? { thumbnailMdUrl: post.thumbnailMdUrl } : {}),
        ...(post.videoUrl ? { videoUrl: post.videoUrl } : {}),
        order: post.order,
        suggestedReplies: editState.suggestedReplies.filter(Boolean),
      })
      setAllPosts((prev) =>
        prev.map((p) =>
          p.postId === editState.postId
            ? {
                ...p,
                caption: editState.caption.trim(),
                context: editState.context.trim() || undefined,
                conversationNarration: editState.conversationNarration.trim() || undefined,
                initialMessage: editState.initialMessage.trim() || undefined,
                suggestedReplies: editState.suggestedReplies.filter(Boolean),
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      )
      setSaveSuccess('Post actualizado.')
      setEditState(null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No pudimos guardar el post.')
    } finally {
      setIsSaving(false)
    }
  }

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''

  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
  }

  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: 13,
    color: '#1e293b',
    verticalAlign: 'middle',
    borderBottom: '1px solid #f1f5f9',
  }

  const isLoading = loadState === 'idle' || loadState === 'loading-characters' || loadState === 'loading-posts'

  return (
    <AdminLayout
      title="Posts de personajes"
      description="Vista unificada de todos los posts con estadísticas de engagement."
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate(appPaths.characters)}
          >
            Ver personajes
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => void loadAll()}
            disabled={isLoading}
          >
            {isLoading
              ? loadProgress
                ? `Cargando ${loadProgress.done}/${loadProgress.total}...`
                : 'Iniciando...'
              : 'Recargar todo'}
          </button>
        </div>
      }
    >
      <section className="admin-video-summary-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Posts totales</span>
          <strong>{allPosts.length}</strong>
          <p>{stats.videoPosts} videos · {allPosts.length - stats.videoPosts} imágenes</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Reproducciones</span>
          <strong>{formatNumber(stats.totalPlays)}</strong>
          <p>Total acumulado en todos los posts.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Conversaciones</span>
          <strong>{formatNumber(stats.totalConvs)}</strong>
          <p>{formatNumber(stats.totalMsgs)} mensajes enviados.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Likes</span>
          <strong>{formatNumber(stats.totalLikes)}</strong>
          <p>Likes acumulados en todos los posts.</p>
        </article>
      </section>

      {loadError && (
        <section className="admin-inline-alert">
          <p>{loadError}</p>
        </section>
      )}

      {saveSuccess && (
        <section className="admin-inline-note admin-inline-note-success">
          <p>{saveSuccess}</p>
        </section>
      )}

      {saveError && (
        <section className="admin-inline-alert">
          <p>{saveError}</p>
        </section>
      )}

      <section className="admin-panel" style={{ padding: 0 }}>
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            alignItems: 'flex-end',
          }}
        >
          <label className="admin-search-field" style={{ flex: '1 1 200px', minWidth: 180 }}>
            <span>Buscar</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caption, contexto, personaje..."
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Personaje</span>
            <select
              value={filterCharacter}
              onChange={(e) => setFilterCharacter(e.target.value)}
              style={{
                padding: '8px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                background: '#fff',
              }}
            >
              <option value="">Todos</option>
              {characters.map((c) => (
                <option key={c.characterId} value={c.characterId}>
                  {c.characterName}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Tipo media</span>
            <select
              value={filterMedia}
              onChange={(e) => setFilterMedia(e.target.value as 'all' | 'image' | 'video')}
              style={{
                padding: '8px 10px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 13,
                background: '#fff',
              }}
            >
              <option value="all">Todo</option>
              <option value="video">Video</option>
              <option value="image">Imagen</option>
            </select>
          </label>

          <span
            style={{
              fontSize: 12,
              color: '#64748b',
              alignSelf: 'center',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {filtered.length} de {allPosts.length} posts
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ ...thStyle, width: 56 }}>Thumb</th>
                <th style={thStyle}>Personaje</th>
                <th style={thStyle} onClick={() => handleSortClick('order')}>
                  #{sortIndicator('order')}
                </th>
                <th style={{ ...thStyle, maxWidth: 260 }}>Caption</th>
                <th style={thStyle}>Tipo</th>
                <th
                  style={thStyle}
                  onClick={() => handleSortClick('playCount')}
                  title="Reproducciones"
                >
                  Plays{sortIndicator('playCount')}
                </th>
                <th
                  style={thStyle}
                  onClick={() => handleSortClick('watched3sCount')}
                  title="Visto 3+ segundos"
                >
                  3s{sortIndicator('watched3sCount')}
                </th>
                <th
                  style={thStyle}
                  onClick={() => handleSortClick('likeCount')}
                  title="Likes"
                >
                  ♥{sortIndicator('likeCount')}
                </th>
                <th
                  style={thStyle}
                  onClick={() => handleSortClick('conversationCount')}
                  title="Conversaciones"
                >
                  Convs{sortIndicator('conversationCount')}
                </th>
                <th
                  style={thStyle}
                  onClick={() => handleSortClick('messageCount')}
                  title="Mensajes enviados"
                >
                  Msgs{sortIndicator('messageCount')}
                </th>
                <th style={thStyle} title="Tasa de conversación (convs/plays)">
                  Conv%
                </th>
                <th
                  style={thStyle}
                  onClick={() => handleSortClick('updatedAt')}
                >
                  Actualizado{sortIndicator('updatedAt')}
                </th>
                <th style={thStyle} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    style={{ ...tdStyle, textAlign: 'center', padding: 32, color: '#94a3b8' }}
                  >
                    {isLoading ? (
                      loadProgress
                        ? `Cargando posts de personajes... ${loadProgress.done}/${loadProgress.total}`
                        : 'Iniciando carga...'
                    ) : (
                      'No hay posts con ese filtro.'
                    )}
                  </td>
                </tr>
              )}
              {filtered.map((post) => {
                const convRate = getEngagementRate(post)
                return (
                  <tr
                    key={`${post.characterId}-${post.postId}`}
                    style={{ transition: 'background 0.1s' }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.background = '#f8fafc'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLTableRowElement).style.background = ''
                    }}
                  >
                    <td style={tdStyle}>
                      <a href={post.videoUrl || post.imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={post.thumbnailUrl || post.imageUrl}
                          alt=""
                          style={{
                            width: 36,
                            height: 52,
                            objectFit: 'cover',
                            borderRadius: 6,
                            display: 'block',
                          }}
                        />
                      </a>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {post.character.avatarImageUrl ? (
                          <img
                            src={post.character.avatarImageUrl}
                            alt=""
                            style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }}
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => navigate(appPaths.character(post.characterId))}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 13,
                            color: '#1e293b',
                            textAlign: 'left',
                          }}
                        >
                          {post.characterName}
                        </button>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#64748b' }}>#{post.order}</td>
                    <td style={{ ...tdStyle, maxWidth: 260 }}>
                      <p
                        style={{
                          margin: 0,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          fontSize: 12,
                          lineHeight: 1.4,
                        }}
                        title={post.caption}
                      >
                        {post.caption}
                      </p>
                    </td>
                    <td style={tdStyle}>
                      <span
                        className="tag tag-muted"
                        style={{ fontSize: 11 }}
                      >
                        {post.videoUrl ? 'Video' : 'Imagen'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(post.playCount)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(post.watched3sCount)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(post.likeCount)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(post.conversationCount)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(post.messageCount)}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: 'right',
                        color: convRate ? (Number(convRate) >= 5 ? '#059669' : '#64748b') : '#94a3b8',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {convRate !== null ? `${convRate}%` : '—'}
                    </td>
                    <td style={{ ...tdStyle, color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {formatDate(post.updatedAt)}
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        className="btn secondary"
                        style={{ padding: '4px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                        onClick={() => openEdit(post)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {editState && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
            overflow: 'auto',
          }}
          onClick={closeEdit}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              color: '#0f172a',
              borderRadius: 16,
              padding: 24,
              maxWidth: 600,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            {(() => {
              const post = allPosts.find((p) => p.postId === editState.postId)
              return (
                <>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                    {post && (
                      <img
                        src={post.thumbnailUrl || post.imageUrl}
                        alt=""
                        style={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                      />
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18 }}>Editar post</h3>
                      {post && (
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
                          {post.characterName} · #{post.order} · {post.videoUrl ? 'Video' : 'Imagen'}
                        </p>
                      )}
                      {post && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 16,
                            marginTop: 8,
                            fontSize: 12,
                            color: '#475569',
                          }}
                        >
                          <span>▶ {formatNumber(post.playCount)}</span>
                          <span>♥ {formatNumber(post.likeCount)}</span>
                          <span>💬 {formatNumber(post.conversationCount)}</span>
                          <span>✉ {formatNumber(post.messageCount)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Caption</span>
                      <textarea
                        rows={3}
                        value={editState.caption}
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, caption: e.target.value })
                        }
                        disabled={isSaving}
                        style={textareaStyle}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        Contexto para chat
                      </span>
                      <textarea
                        rows={2}
                        value={editState.context}
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, context: e.target.value })
                        }
                        disabled={isSaving}
                        placeholder="Describe lo que el avatar debe saber al responder este post."
                        style={textareaStyle}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        Narración inicial
                      </span>
                      <textarea
                        rows={2}
                        value={editState.conversationNarration}
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, conversationNarration: e.target.value })
                        }
                        disabled={isSaving}
                        placeholder="Ej: Zoe looks up from her phone."
                        style={textareaStyle}
                      />
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        Primer mensaje
                      </span>
                      <textarea
                        rows={2}
                        value={editState.initialMessage}
                        onChange={(e) =>
                          setEditState((s) => s && { ...s, initialMessage: e.target.value })
                        }
                        disabled={isSaving}
                        placeholder="Mensaje en inglés que verá el usuario al abrir Conversar."
                        style={textareaStyle}
                      />
                    </label>

                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        Respuestas sugeridas
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {editState.suggestedReplies.map((reply, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={reply}
                            maxLength={120}
                            disabled={isSaving}
                            onChange={(e) => {
                              const val = e.target.value
                              setEditState((s) => {
                                if (!s) return s
                                const next = [...s.suggestedReplies] as [string, string, string]
                                next[idx] = val
                                return { ...s, suggestedReplies: next }
                              })
                            }}
                            placeholder={`Respuesta ${idx + 1}`}
                            style={inputStyle}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {saveError && (
                    <p
                      style={{
                        marginTop: 12,
                        padding: '8px 12px',
                        background: '#fef2f2',
                        color: '#991b1b',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      {saveError}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: 20,
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={closeEdit}
                      disabled={isSaving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => void handleSaveEdit()}
                      disabled={isSaving || !editState.caption.trim()}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  resize: 'vertical',
  boxSizing: 'border-box',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}
