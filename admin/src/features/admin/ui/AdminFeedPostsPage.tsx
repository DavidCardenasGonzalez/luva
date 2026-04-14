import { useMemo, useState } from 'react'
import {
  createAdminAssetUpload,
  createAdminFeedPost,
  deleteAdminFeedPost,
  updateAdminFeedPost,
} from '@/features/admin/api/admin-client'
import type { AdminFeedPostWritePayload } from '@/features/admin/api/admin-client'
import { useAdminFeedPosts } from '@/features/admin/model/use-admin-feed-posts'
import type {
  AdminFeedPost,
  AdminFeedPostType,
} from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

type FeedPostFormState = {
  text: string
  order: string
  postType: AdminFeedPostType
  imageUrl: string
  videoUrl: string
  practiceId: string
  missionId: string
  coinAmount: string
}

const POST_TYPE_OPTIONS: Array<{ value: AdminFeedPostType; label: string; helper: string }> = [
  {
    value: 'normal',
    label: 'Normal',
    helper: 'Solo texto y media opcional.',
  },
  {
    value: 'practice_guide',
    label: 'Guia practica',
    helper: 'Abre una practica por id.',
  },
  {
    value: 'mission_guide',
    label: 'Guia mision',
    helper: 'Abre una mision por id.',
  },
  {
    value: 'extra',
    label: 'Extra',
    helper: 'Permite reclamar monedas.',
  },
]

function buildEmptyForm(nextOrder: number): FeedPostFormState {
  return {
    text: '',
    order: String(Math.max(1, nextOrder)),
    postType: 'normal',
    imageUrl: '',
    videoUrl: '',
    practiceId: '',
    missionId: '',
    coinAmount: '',
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return 'Sin fecha'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 KB'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let size = value
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getPostTypeLabel(type: AdminFeedPostType) {
  return POST_TYPE_OPTIONS.find((option) => option.value === type)?.label || type
}

function getNextOrder(posts: AdminFeedPost[]) {
  const maxOrder = posts.reduce((max, post) => Math.max(max, post.order), 0)
  return maxOrder + 1
}

function formFromPost(post: AdminFeedPost): FeedPostFormState {
  return {
    text: post.text,
    order: String(post.order),
    postType: post.postType,
    imageUrl: post.imageUrl || '',
    videoUrl: post.videoUrl || '',
    practiceId: post.practiceId || '',
    missionId: post.missionId || '',
    coinAmount: post.coinAmount ? String(post.coinAmount) : '',
  }
}

function trimOptional(value: string) {
  return value.trim() || undefined
}

function buildPayload(form: FeedPostFormState): AdminFeedPostWritePayload {
  const order = Number(form.order)
  const payload: AdminFeedPostWritePayload = {
    text: form.text.trim(),
    order,
    postType: form.postType,
    imageUrl: trimOptional(form.imageUrl),
    videoUrl: trimOptional(form.videoUrl),
  }

  if (form.postType === 'practice_guide') {
    payload.practiceId = form.practiceId.trim()
  }

  if (form.postType === 'mission_guide') {
    payload.missionId = form.missionId.trim()
  }

  if (form.postType === 'extra') {
    payload.coinAmount = Number(form.coinAmount)
  }

  return payload
}

async function uploadFeedPostAsset(file: File, kind: 'image' | 'video') {
  const upload = await createAdminAssetUpload(
    kind === 'image' ? 'feedPostImages' : 'feedPostVideos',
    file.type,
    file.name,
  )
  const uploadResponse = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': upload.contentType,
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error(`No pudimos subir ${file.name}. HTTP ${uploadResponse.status}`)
  }

  return upload.url
}

export function AdminFeedPostsPage() {
  const { data, error, isLoading, reload } = useAdminFeedPosts()
  const posts = useMemo(() => data?.posts || [], [data?.posts])
  const [editingPostId, setEditingPostId] = useState<string>()
  const [form, setForm] = useState<FeedPostFormState>(() => buildEmptyForm(1))
  const [imageFile, setImageFile] = useState<File>()
  const [videoFile, setVideoFile] = useState<File>()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingPostId, setIsDeletingPostId] = useState<string>()
  const [stage, setStage] = useState<string>()
  const [actionError, setActionError] = useState<string>()
  const [actionMessage, setActionMessage] = useState<string>()

  const selectedType = POST_TYPE_OPTIONS.find((option) => option.value === form.postType) || POST_TYPE_OPTIONS[0]
  const mediaPostsCount = posts.filter((post) => post.imageUrl || post.videoUrl).length
  const extrasCount = posts.filter((post) => post.postType === 'extra').length

  const resetForm = () => {
    setEditingPostId(undefined)
    setForm(buildEmptyForm(getNextOrder(posts)))
    setImageFile(undefined)
    setVideoFile(undefined)
    setStage(undefined)
  }

  const handleEdit = (post: AdminFeedPost) => {
    setEditingPostId(post.postId)
    setForm(formFromPost(post))
    setImageFile(undefined)
    setVideoFile(undefined)
    setStage(undefined)
    setActionError(undefined)
    setActionMessage(undefined)
  }

  const handleSubmit = async () => {
    if (isSaving) {
      return
    }

    setIsSaving(true)
    setActionError(undefined)
    setActionMessage(undefined)

    try {
      let nextForm = form

      if (imageFile) {
        setStage('Subiendo imagen al bucket de assets...')
        const imageUrl = await uploadFeedPostAsset(imageFile, 'image')
        nextForm = { ...nextForm, imageUrl }
      }

      if (videoFile) {
        setStage('Subiendo video al bucket de assets...')
        const videoUrl = await uploadFeedPostAsset(videoFile, 'video')
        nextForm = { ...nextForm, videoUrl }
      }

      setStage(editingPostId ? 'Actualizando post...' : 'Guardando post...')
      const payload = buildPayload(nextForm)

      if (editingPostId) {
        await updateAdminFeedPost({ ...payload, postId: editingPostId })
        setActionMessage('Post actualizado en el feed.')
      } else {
        await createAdminFeedPost(payload)
        setActionMessage('Post creado en el feed.')
      }

      const nextOrderAfterSave = editingPostId
        ? getNextOrder(posts)
        : Math.max(getNextOrder(posts), payload.order + 1)
      setForm(buildEmptyForm(nextOrderAfterSave))
      setEditingPostId(undefined)
      setImageFile(undefined)
      setVideoFile(undefined)
      setStage(undefined)
      reload()
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : 'No pudimos guardar el post.',
      )
      setStage(undefined)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (post: AdminFeedPost) => {
    if (!window.confirm(`Borrar el post en orden ${post.order}?`)) {
      return
    }

    setIsDeletingPostId(post.postId)
    setActionError(undefined)
    setActionMessage(undefined)

    try {
      await deleteAdminFeedPost(post.postId)
      if (editingPostId === post.postId) {
        resetForm()
      }
      setActionMessage('Post borrado del feed.')
      reload()
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No pudimos borrar el post.',
      )
    } finally {
      setIsDeletingPostId(undefined)
    }
  }

  return (
    <AdminLayout
      title="Posts"
      description="Crea posts ordenados para el feed. El orden 1 aparece hasta arriba."
      actions={
        <button type="button" className="btn secondary" onClick={reload} disabled={isLoading}>
          {isLoading ? 'Actualizando...' : 'Recargar posts'}
        </button>
      }
    >
      <section className="admin-video-summary-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Posts</span>
          <strong>{posts.length}</strong>
          <p>Items configurados para entrar al feed de la app.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Con media</span>
          <strong>{mediaPostsCount}</strong>
          <p>Posts con imagen o video guardados como URL publica de assets.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Extras</span>
          <strong>{extrasCount}</strong>
          <p>Posts que entregan monedas desde el feed.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Siguiente orden</span>
          <strong>{getNextOrder(posts)}</strong>
          <p>Usa este numero para agregarlo al final del bloque administrado.</p>
        </article>
      </section>

      {error && (
        <section className="admin-inline-alert">
          <p>{error}</p>
        </section>
      )}

      {actionError && (
        <section className="admin-inline-alert">
          <p>{actionError}</p>
        </section>
      )}

      {actionMessage && (
        <section className="admin-inline-note admin-inline-note-success">
          <p>{actionMessage}</p>
        </section>
      )}

      <section className="admin-feed-posts-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">{editingPostId ? 'Editar post' : 'Nuevo post'}</p>
            <h3>{editingPostId ? 'Actualizar contenido' : 'Crear post'}</h3>
          </div>

          <div className="admin-feed-post-form">
            <label className="admin-grant-field">
              <span>Texto</span>
              <textarea
                value={form.text}
                onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                placeholder="Escribe el texto que vera el usuario en el feed."
                disabled={isSaving}
              />
            </label>

            <div className="admin-feed-post-form-row">
              <label className="admin-grant-field">
                <span>Orden</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.order}
                  onChange={(event) => setForm((current) => ({ ...current, order: event.target.value }))}
                  disabled={isSaving}
                />
              </label>

              <label className="admin-grant-field">
                <span>Tipo</span>
                <select
                  value={form.postType}
                  onChange={(event) => {
                    const postType = event.target.value as AdminFeedPostType
                    setForm((current) => ({
                      ...current,
                      postType,
                      practiceId: postType === 'practice_guide' ? current.practiceId : '',
                      missionId: postType === 'mission_guide' ? current.missionId : '',
                      coinAmount: postType === 'extra' ? current.coinAmount : '',
                    }))
                  }}
                  disabled={isSaving}
                >
                  {POST_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="admin-inline-note admin-inline-note-compact">
              <p>{selectedType.helper}</p>
            </div>

            {form.postType === 'practice_guide' && (
              <label className="admin-grant-field">
                <span>ID de practica</span>
                <input
                  value={form.practiceId}
                  onChange={(event) => setForm((current) => ({ ...current, practiceId: event.target.value }))}
                  placeholder="Ej. 42"
                  disabled={isSaving}
                />
              </label>
            )}

            {form.postType === 'mission_guide' && (
              <label className="admin-grant-field">
                <span>ID de mision</span>
                <input
                  value={form.missionId}
                  onChange={(event) => setForm((current) => ({ ...current, missionId: event.target.value }))}
                  placeholder="Ej. blind_date_surprise_robot_romantic"
                  disabled={isSaving}
                />
              </label>
            )}

            {form.postType === 'extra' && (
              <label className="admin-grant-field">
                <span>Cantidad de monedas</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.coinAmount}
                  onChange={(event) => setForm((current) => ({ ...current, coinAmount: event.target.value }))}
                  placeholder="Ej. 5"
                  disabled={isSaving}
                />
              </label>
            )}

            <div className="admin-feed-post-form-row">
              <label className="admin-grant-field">
                <span>Imagen opcional</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isSaving}
                  onChange={(event) => {
                    setImageFile(event.target.files?.[0])
                  }}
                />
              </label>

              <label className="admin-grant-field">
                <span>Video opcional</span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/x-m4v,video/mpeg"
                  disabled={isSaving}
                  onChange={(event) => {
                    setVideoFile(event.target.files?.[0])
                  }}
                />
              </label>
            </div>

            {(imageFile || videoFile || form.imageUrl || form.videoUrl) && (
              <div className="admin-session-list admin-asset-meta-list">
                {imageFile && (
                  <div className="admin-session-item">
                    <span>Imagen nueva</span>
                    <strong>{imageFile.name}</strong>
                    <p>{formatBytes(imageFile.size)}</p>
                  </div>
                )}
                {videoFile && (
                  <div className="admin-session-item">
                    <span>Video nuevo</span>
                    <strong>{videoFile.name}</strong>
                    <p>{formatBytes(videoFile.size)}</p>
                  </div>
                )}
                {form.imageUrl && (
                  <div className="admin-session-item">
                    <span>Imagen guardada</span>
                    <strong>
                      <a href={form.imageUrl} target="_blank" rel="noreferrer">
                        Abrir imagen
                      </a>
                    </strong>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setForm((current) => ({ ...current, imageUrl: '' }))}
                      disabled={isSaving}
                    >
                      Quitar imagen
                    </button>
                  </div>
                )}
                {form.videoUrl && (
                  <div className="admin-session-item">
                    <span>Video guardado</span>
                    <strong>
                      <a href={form.videoUrl} target="_blank" rel="noreferrer">
                        Abrir video
                      </a>
                    </strong>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setForm((current) => ({ ...current, videoUrl: '' }))}
                      disabled={isSaving}
                    >
                      Quitar video
                    </button>
                  </div>
                )}
              </div>
            )}

            {stage && (
              <div className="admin-inline-note">
                <p><strong>{stage}</strong></p>
              </div>
            )}

            <div className="admin-action-row">
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  void handleSubmit()
                }}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : editingPostId ? 'Actualizar post' : 'Crear post'}
              </button>
              {editingPostId && (
                <button type="button" className="btn ghost" onClick={resetForm} disabled={isSaving}>
                  Cancelar edicion
                </button>
              )}
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Feed</p>
            <h3>Posts ordenados</h3>
          </div>

          <div className="admin-feed-post-list">
            {posts.map((post) => (
              <article
                key={post.postId}
                className={editingPostId === post.postId ? 'admin-feed-post-row admin-feed-post-row-active' : 'admin-feed-post-row'}
              >
                <div className="admin-feed-post-row-main">
                  <div className="admin-video-row-headline">
                    <strong>#{post.order}</strong>
                    <span className="tag">{getPostTypeLabel(post.postType)}</span>
                  </div>
                  <p>{post.text}</p>
                  <div className="admin-user-row-meta">
                    {post.imageUrl && <span className="tag tag-muted">Imagen</span>}
                    {post.videoUrl && <span className="tag tag-muted">Video</span>}
                    {post.practiceId && <span className="tag tag-muted">Practica {post.practiceId}</span>}
                    {post.missionId && <span className="tag tag-muted">Mision {post.missionId}</span>}
                    {post.coinAmount && <span className="tag tag-muted">{post.coinAmount} monedas</span>}
                  </div>
                  <span className="admin-video-row-time">Actualizado {formatDateTime(post.updatedAt)}</span>
                </div>

                <div className="admin-feed-post-actions">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => handleEdit(post)}
                    disabled={isSaving || isDeletingPostId === post.postId}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      void handleDelete(post)
                    }}
                    disabled={isSaving || isDeletingPostId === post.postId}
                  >
                    {isDeletingPostId === post.postId ? 'Borrando...' : 'Borrar'}
                  </button>
                </div>
              </article>
            ))}

            {!posts.length && (
              <div className="admin-empty-state admin-empty-state-compact">
                <strong>No hay posts configurados.</strong>
                <p>Crea el primer post con orden 1 para mostrarlo al inicio del feed.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}
