import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import {
  createAdminAssetUpload,
  createAdminCharacterPost,
  deleteAdminCharacterPost,
  updateAdminCharacterPost,
} from '@/features/admin/api/admin-client'
import type { AdminCharacterPostWritePayload } from '@/features/admin/api/admin-client'
import { useAdminCharacterPosts } from '@/features/admin/model/use-admin-character-posts'
import type { AdminCharacterPost } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

type CharacterPostFormState = {
  caption: string
  imageUrl: string
  order: string
}

function decodeParam(value?: string) {
  if (!value) {
    return undefined
  }

  try {
    return decodeURIComponent(value)
  } catch {
    return value
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

function getNextOrder(posts: AdminCharacterPost[]) {
  const maxOrder = posts.reduce((max, post) => Math.max(max, post.order), 0)
  return maxOrder + 1
}

function buildEmptyForm(nextOrder: number): CharacterPostFormState {
  return {
    caption: '',
    imageUrl: '',
    order: String(Math.max(1, nextOrder)),
  }
}

function formFromPost(post: AdminCharacterPost): CharacterPostFormState {
  return {
    caption: post.caption,
    imageUrl: post.imageUrl,
    order: String(post.order),
  }
}

function buildPayload(form: CharacterPostFormState): AdminCharacterPostWritePayload {
  const order = Number(form.order)
  return {
    caption: form.caption.trim(),
    imageUrl: form.imageUrl.trim(),
    ...(Number.isFinite(order) && order >= 1 ? { order: Math.floor(order) } : {}),
  }
}

async function uploadAvatarPostImage(file: File) {
  const upload = await createAdminAssetUpload('avatarPosts', file.type, file.name)
  const uploadResponse = await fetch(upload.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': upload.contentType,
      ...(upload.cacheControl ? { 'Cache-Control': upload.cacheControl } : {}),
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error(`No pudimos subir ${file.name}. HTTP ${uploadResponse.status}`)
  }

  return upload.url
}

export function AdminCharacterPostsPage() {
  const navigate = useNavigate()
  const params = useParams()
  const characterId = decodeParam(params.characterId)
  const { data, error, isLoading, reload } = useAdminCharacterPosts(characterId)
  const posts = useMemo(() => data?.posts || [], [data?.posts])
  const [editingPostId, setEditingPostId] = useState<string>()
  const [form, setForm] = useState<CharacterPostFormState>(() => buildEmptyForm(1))
  const [imageFile, setImageFile] = useState<File>()
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingPostId, setIsDeletingPostId] = useState<string>()
  const [stage, setStage] = useState<string>()
  const [actionError, setActionError] = useState<string>()
  const [actionMessage, setActionMessage] = useState<string>()

  const character = data?.character
  const nextOrder = getNextOrder(posts)
  const hasImages = posts.filter((post) => post.imageUrl).length

  const resetForm = () => {
    setEditingPostId(undefined)
    setForm(buildEmptyForm(nextOrder))
    setImageFile(undefined)
    setStage(undefined)
  }

  const handleEdit = (post: AdminCharacterPost) => {
    setEditingPostId(post.postId)
    setForm(formFromPost(post))
    setImageFile(undefined)
    setStage(undefined)
    setActionError(undefined)
    setActionMessage(undefined)
  }

  const handleSubmit = async () => {
    if (isSaving || !characterId) {
      return
    }

    setIsSaving(true)
    setActionError(undefined)
    setActionMessage(undefined)

    try {
      let nextForm = form

      if (imageFile) {
        setStage('Subiendo imagen a avatarPosts...')
        const imageUrl = await uploadAvatarPostImage(imageFile)
        nextForm = { ...nextForm, imageUrl }
      }

      if (!nextForm.imageUrl.trim()) {
        throw new Error('Selecciona una imagen para guardar el post.')
      }

      setStage(editingPostId ? 'Actualizando post del perfil...' : 'Guardando post del perfil...')
      const payload = buildPayload(nextForm)

      if (editingPostId) {
        await updateAdminCharacterPost(characterId, { ...payload, postId: editingPostId })
        setActionMessage('Post actualizado en el perfil.')
      } else {
        await createAdminCharacterPost(characterId, payload)
        setActionMessage('Post creado en el perfil.')
      }

      setEditingPostId(undefined)
      setForm(buildEmptyForm(Math.max(nextOrder, (payload.order || nextOrder) + 1)))
      setImageFile(undefined)
      setStage(undefined)
      reload()
    } catch (saveError) {
      setActionError(
        saveError instanceof Error
          ? saveError.message
          : 'No pudimos guardar el post del perfil.',
      )
      setStage(undefined)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (post: AdminCharacterPost) => {
    if (!characterId || !window.confirm(`Borrar el post #${post.order} de ${post.characterName}?`)) {
      return
    }

    setIsDeletingPostId(post.postId)
    setActionError(undefined)
    setActionMessage(undefined)

    try {
      await deleteAdminCharacterPost(characterId, post.postId)
      if (editingPostId === post.postId) {
        resetForm()
      }
      setActionMessage('Post borrado del perfil.')
      reload()
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : 'No pudimos borrar el post del perfil.',
      )
    } finally {
      setIsDeletingPostId(undefined)
    }
  }

  return (
    <AdminLayout
      title={character?.characterName || 'Perfil de personaje'}
      description={character ? `${character.storyTitle} · ${character.missionTitle}` : 'Carga posts con imagen y caption para este personaje.'}
      actions={
        <>
          <button type="button" className="btn secondary" onClick={() => navigate(appPaths.stories)}>
            Volver a stories
          </button>
          <button type="button" className="btn ghost" onClick={reload} disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Recargar'}
          </button>
        </>
      }
    >
      <section className="admin-video-summary-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Posts</span>
          <strong>{posts.length}</strong>
          <p>Imagenes guardadas en el perfil del personaje.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Con imagen</span>
          <strong>{hasImages}</strong>
          <p>Posts con URL publica de CloudFront.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Siguiente orden</span>
          <strong>{nextOrder}</strong>
          <p>Orden sugerido para el nuevo post.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Carpeta</span>
          <strong>avatarPosts</strong>
          <p>Subidas dedicadas para imagenes del perfil.</p>
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

      <section className="admin-character-posts-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">{editingPostId ? 'Editar post' : 'Nuevo post'}</p>
            <h3>{editingPostId ? 'Actualizar perfil' : 'Agregar post'}</h3>
          </div>

          {character && (
            <div className="admin-story-character-detail-card">
              <span className="admin-story-character-avatar admin-story-character-avatar-large">
                {character.avatarImageUrl ? <img src={character.avatarImageUrl} alt="" /> : character.characterName.charAt(0)}
              </span>
              <div>
                <strong>{character.characterName}</strong>
                <p>{character.missionTitle}</p>
                <div className="admin-user-row-meta">
                  <span className="tag">{character.storyTitle}</span>
                  <span className="tag tag-muted">Escena {character.sceneIndex + 1}</span>
                </div>
              </div>
            </div>
          )}

          <div className="admin-feed-post-form">
            <label className="admin-grant-field">
              <span>Caption</span>
              <textarea
                value={form.caption}
                onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))}
                placeholder="Escribe el caption que vera el usuario."
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
                <span>Imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isSaving}
                  onChange={(event) => {
                    setImageFile(event.target.files?.[0])
                  }}
                />
              </label>
            </div>

            {(imageFile || form.imageUrl) && (
              <div className="admin-session-list admin-asset-meta-list">
                {imageFile && (
                  <div className="admin-session-item">
                    <span>Imagen nueva</span>
                    <strong>{imageFile.name}</strong>
                    <p>{formatBytes(imageFile.size)}</p>
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
                disabled={isSaving || !characterId}
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
            <p className="eyebrow">Perfil</p>
            <h3>Posts publicados</h3>
          </div>

          <div className="admin-character-post-grid">
            {posts.map((post) => (
              <article
                key={post.postId}
                className={editingPostId === post.postId ? 'admin-character-post-card admin-character-post-card-active' : 'admin-character-post-card'}
              >
                <a href={post.imageUrl} target="_blank" rel="noreferrer" className="admin-character-post-image">
                  <img src={post.imageUrl} alt="" />
                </a>
                <div className="admin-character-post-copy">
                  <div className="admin-video-row-headline">
                    <strong>#{post.order}</strong>
                    <span className="tag tag-muted">Post</span>
                  </div>
                  <p>{post.caption}</p>
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
                <strong>No hay posts para este perfil.</strong>
                <p>Sube la primera imagen y agrega su caption.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </AdminLayout>
  )
}
