import { useEffect, useMemo, useState } from 'react'
import {
  completeShadowingCoverImageUpload,
  completeShadowingAudioUpload,
  completeShadowingSubtitlesUpload,
  createAdminShadowingChapter,
  createAdminShadowingList,
  createShadowingCoverImageUpload,
  createShadowingAudioUpload,
  createShadowingSubtitlesUpload,
  deleteAdminShadowingChapter,
  deleteAdminShadowingList,
  generateShadowingSubtitles,
  updateAdminShadowingChapter,
  updateAdminShadowingList,
} from '@/features/admin/api/admin-client'
import type {
  AdminShadowingChapter,
  AdminShadowingChapterStatus,
  AdminShadowingList,
  AdminShadowingStatus,
} from '@/features/admin/model/types'
import { useAdminShadowing } from '@/features/admin/model/use-admin-shadowing'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

type ListFormState = {
  name: string
  category: string
  order: string
  status: AdminShadowingStatus
}

type ChapterFormState = {
  listId: string
  title: string
  description: string
  order: string
  status: AdminShadowingChapterStatus
  durationSeconds: string
}

const AUDIO_ACCEPT = 'audio/mpeg,audio/mp4,audio/aac,audio/wav,audio/ogg,audio/webm,audio/x-m4a,audio/x-wav'
const IMAGE_ACCEPT = 'image/avif,image/gif,image/heic,image/heif,image/jpeg,image/png,image/webp'
const SUBTITLES_ACCEPT = '.srt,.vtt,application/x-subrip,text/srt,text/vtt,text/plain'

function emptyListForm(nextOrder: number): ListFormState {
  return {
    name: '',
    category: '',
    order: String(Math.max(1, nextOrder)),
    status: 'draft',
  }
}

function emptyChapterForm(listId: string, nextOrder: number): ChapterFormState {
  return {
    listId,
    title: '',
    description: '',
    order: String(Math.max(1, nextOrder)),
    status: 'draft',
    durationSeconds: '',
  }
}

function formatDateTime(value?: string) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

function getNextListOrder(lists: AdminShadowingList[]) {
  return lists.reduce((max, list) => Math.max(max, list.order), 0) + 1
}

function getNextChapterOrder(list?: AdminShadowingList) {
  return (list?.chapters || []).reduce((max, chapter) => Math.max(max, chapter.order), 0) + 1
}

function listFormFromList(list: AdminShadowingList): ListFormState {
  return {
    name: list.name,
    category: list.category,
    order: String(list.order),
    status: list.status,
  }
}

function chapterFormFromChapter(chapter: AdminShadowingChapter): ChapterFormState {
  return {
    listId: chapter.listId,
    title: chapter.title,
    description: chapter.description,
    order: String(chapter.order),
    status: chapter.status,
    durationSeconds: chapter.durationSeconds ? String(chapter.durationSeconds) : '',
  }
}

function parsePositiveNumber(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function chapterKey(chapter: AdminShadowingChapter) {
  return `${chapter.listId}:${chapter.chapterId}`
}

function listCoverKey(list: AdminShadowingList) {
  return `${list.listId}:cover`
}

async function uploadCoverImageFile(list: AdminShadowingList, file: File) {
  const upload = await createShadowingCoverImageUpload(list.listId, file.type, file.name)

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

  await completeShadowingCoverImageUpload(list.listId, upload.key)
}

async function uploadAudioFile(
  chapter: AdminShadowingChapter,
  file: File,
) {
  const upload = await createShadowingAudioUpload(
    chapter.listId,
    chapter.chapterId,
    file.type,
    file.name,
  )

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

  await completeShadowingAudioUpload(chapter.listId, chapter.chapterId, upload.key)
}

async function uploadSubtitlesFile(
  chapter: AdminShadowingChapter,
  file: File,
) {
  const upload = await createShadowingSubtitlesUpload(
    chapter.listId,
    chapter.chapterId,
    file.type,
    file.name,
  )

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

  await completeShadowingSubtitlesUpload(chapter.listId, chapter.chapterId, upload.key)
}

export function AdminShadowingPage() {
  const { data, error, isLoading, reload } = useAdminShadowing()
  const lists = useMemo(() => data?.lists || [], [data?.lists])
  const [selectedListId, setSelectedListId] = useState<string>('')

  const selectedList = lists.find((list) => list.listId === selectedListId) || lists[0]
  const chapters = selectedList?.chapters || []

  const [editingListId, setEditingListId] = useState<string>()
  const [listForm, setListForm] = useState<ListFormState>(() => emptyListForm(1))
  const [isSavingList, setIsSavingList] = useState(false)
  const [listMessage, setListMessage] = useState<string>()
  const [listError, setListError] = useState<string>()

  const [editingChapterId, setEditingChapterId] = useState<string>()
  const [chapterForm, setChapterForm] = useState<ChapterFormState>(() => emptyChapterForm('', 1))
  const [isSavingChapter, setIsSavingChapter] = useState(false)
  const [chapterMessage, setChapterMessage] = useState<string>()
  const [chapterError, setChapterError] = useState<string>()

  const [uploadingKey, setUploadingKey] = useState<string>()
  const [uploadError, setUploadError] = useState<string>()
  const [generatingSubtitlesKey, setGeneratingSubtitlesKey] = useState<string>()

  useEffect(() => {
    if (!lists.length) {
      setSelectedListId('')
      return
    }

    if (!selectedListId || !lists.some((list) => list.listId === selectedListId)) {
      setSelectedListId(lists[0].listId)
    }
  }, [lists, selectedListId])

  useEffect(() => {
    if (!editingListId) {
      setListForm(emptyListForm(getNextListOrder(lists)))
    }
  }, [editingListId, lists])

  useEffect(() => {
    if (!editingChapterId) {
      setChapterForm(emptyChapterForm(selectedList?.listId || '', getNextChapterOrder(selectedList)))
    }
  }, [editingChapterId, selectedList])

  const resetListForm = () => {
    setEditingListId(undefined)
    setListForm(emptyListForm(getNextListOrder(lists)))
    setListError(undefined)
  }

  const resetChapterForm = () => {
    setEditingChapterId(undefined)
    setChapterForm(emptyChapterForm(selectedList?.listId || '', getNextChapterOrder(selectedList)))
    setChapterError(undefined)
  }

  const handleSaveList = async () => {
    setIsSavingList(true)
    setListError(undefined)
    setListMessage(undefined)

    try {
      const payload = {
        name: listForm.name.trim(),
        category: listForm.category.trim(),
        order: Number(listForm.order),
        status: listForm.status,
      }

      if (editingListId) {
        await updateAdminShadowingList({ ...payload, listId: editingListId })
        setListMessage('Lista actualizada.')
      } else {
        const response = await createAdminShadowingList(payload)
        setSelectedListId(response.list.listId)
        setListMessage('Lista creada.')
      }

      resetListForm()
      reload()
    } catch (saveError) {
      setListError(saveError instanceof Error ? saveError.message : 'No pudimos guardar la lista.')
    } finally {
      setIsSavingList(false)
    }
  }

  const handleEditList = (list: AdminShadowingList) => {
    setEditingListId(list.listId)
    setListForm(listFormFromList(list))
    setListError(undefined)
    setListMessage(undefined)
  }

  const handleDeleteList = async (list: AdminShadowingList) => {
    if (!window.confirm(`Eliminar "${list.name}" y sus capitulos?`)) return
    setListError(undefined)
    setListMessage(undefined)

    try {
      await deleteAdminShadowingList(list.listId)
      setListMessage('Lista eliminada.')
      resetListForm()
      reload()
    } catch (deleteError) {
      setListError(deleteError instanceof Error ? deleteError.message : 'No pudimos eliminar la lista.')
    }
  }

  const handleSaveChapter = async () => {
    setIsSavingChapter(true)
    setChapterError(undefined)
    setChapterMessage(undefined)

    try {
      const payload = {
        listId: chapterForm.listId || selectedList?.listId || '',
        title: chapterForm.title.trim(),
        description: chapterForm.description.trim(),
        order: Number(chapterForm.order),
        status: chapterForm.status,
        durationSeconds: parsePositiveNumber(chapterForm.durationSeconds),
      }

      if (editingChapterId) {
        await updateAdminShadowingChapter({ ...payload, chapterId: editingChapterId })
        setChapterMessage('Capitulo actualizado.')
      } else {
        await createAdminShadowingChapter(payload)
        setChapterMessage('Capitulo creado.')
      }

      resetChapterForm()
      reload()
    } catch (saveError) {
      setChapterError(saveError instanceof Error ? saveError.message : 'No pudimos guardar el capitulo.')
    } finally {
      setIsSavingChapter(false)
    }
  }

  const handleEditChapter = (chapter: AdminShadowingChapter) => {
    setSelectedListId(chapter.listId)
    setEditingChapterId(chapter.chapterId)
    setChapterForm(chapterFormFromChapter(chapter))
    setChapterError(undefined)
    setChapterMessage(undefined)
  }

  const handleDeleteChapter = async (chapter: AdminShadowingChapter) => {
    if (!window.confirm(`Eliminar "${chapter.title}"?`)) return
    setChapterError(undefined)
    setChapterMessage(undefined)

    try {
      await deleteAdminShadowingChapter(chapter.listId, chapter.chapterId)
      setChapterMessage('Capitulo eliminado.')
      resetChapterForm()
      reload()
    } catch (deleteError) {
      setChapterError(deleteError instanceof Error ? deleteError.message : 'No pudimos eliminar el capitulo.')
    }
  }

  const handleAudioSelected = async (
    chapter: AdminShadowingChapter,
    file?: File,
  ) => {
    if (!file) return

    const key = chapterKey(chapter)
    setUploadingKey(key)
    setUploadError(undefined)

    try {
      await uploadAudioFile(chapter, file)
      reload()
    } catch (audioError) {
      setUploadError(audioError instanceof Error ? audioError.message : 'No pudimos subir el audio.')
    } finally {
      setUploadingKey(undefined)
    }
  }

  const handleCoverSelected = async (list: AdminShadowingList, file?: File) => {
    if (!file) return

    setUploadingKey(listCoverKey(list))
    setUploadError(undefined)

    try {
      await uploadCoverImageFile(list, file)
      reload()
    } catch (coverError) {
      setUploadError(coverError instanceof Error ? coverError.message : 'No pudimos subir el cover.')
    } finally {
      setUploadingKey(undefined)
    }
  }

  const handleSubtitlesSelected = async (
    chapter: AdminShadowingChapter,
    file?: File,
  ) => {
    if (!file) return

    const key = `${chapterKey(chapter)}:subtitles`
    setUploadingKey(key)
    setUploadError(undefined)

    try {
      await uploadSubtitlesFile(chapter, file)
      reload()
    } catch (subtitlesError) {
      setUploadError(subtitlesError instanceof Error ? subtitlesError.message : 'No pudimos subir los subtitulos.')
    } finally {
      setUploadingKey(undefined)
    }
  }

  const handleGenerateSubtitles = async (chapter: AdminShadowingChapter) => {
    const key = chapterKey(chapter)
    setGeneratingSubtitlesKey(key)
    setUploadError(undefined)

    try {
      await generateShadowingSubtitles(chapter.listId, chapter.chapterId)
      reload()
    } catch (subtitlesError) {
      setUploadError(subtitlesError instanceof Error ? subtitlesError.message : 'No pudimos generar los subtitulos.')
    } finally {
      setGeneratingSubtitlesKey(undefined)
    }
  }

  return (
    <AdminLayout
      title="Shadowing"
      description="Administra listas y capitulos de practica con audio en ingles."
      actions={
        <button type="button" className="btn secondary" onClick={reload} disabled={isLoading}>
          {isLoading ? 'Cargando...' : 'Recargar'}
        </button>
      }
    >
      {(error || listError || chapterError || uploadError) && (
        <section className="admin-inline-alert">
          <p>{error || listError || chapterError || uploadError}</p>
        </section>
      )}

      {(listMessage || chapterMessage) && (
        <section className="admin-inline-note admin-inline-note-success">
          <p>{listMessage || chapterMessage}</p>
        </section>
      )}

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Listas</span>
          <strong>{lists.length}</strong>
          <p>Catalogos por nombre y categoria.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Capitulos</span>
          <strong>{lists.reduce((total, list) => total + list.chapters.length, 0)}</strong>
            <p>Practicas de audio disponibles para cargar.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Publicadas</span>
          <strong>{lists.filter((list) => list.status === 'published').length}</strong>
          <p>Solo estas aparecen en la app.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Con audio</span>
          <strong>{lists.reduce((total, list) => total + list.chapters.filter((chapter) => chapter.audioUrl).length, 0)}</strong>
          <p>Subir audio marca el capitulo como listo.</p>
        </article>
      </section>

      <section className="admin-content-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">{editingListId ? 'Editar lista' : 'Nueva lista'}</p>
            <h3>Listas de Shadowing</h3>
          </div>

          <div className="admin-asset-form">
            <label className="admin-grant-field">
              <span>Nombre</span>
              <input
                type="text"
                value={listForm.name}
                onChange={(event) => setListForm((form) => ({ ...form, name: event.target.value }))}
                placeholder="Ej. Daily conversations"
              />
            </label>
            <label className="admin-grant-field">
              <span>Categoria</span>
              <input
                type="text"
                value={listForm.category}
                onChange={(event) => setListForm((form) => ({ ...form, category: event.target.value }))}
                placeholder="Ej. Conversacion"
              />
            </label>
            <label className="admin-grant-field">
              <span>Orden</span>
              <input
                type="number"
                min="1"
                value={listForm.order}
                onChange={(event) => setListForm((form) => ({ ...form, order: event.target.value }))}
              />
            </label>
            <label className="admin-grant-field">
              <span>Estado</span>
              <select
                value={listForm.status}
                onChange={(event) => setListForm((form) => ({ ...form, status: event.target.value as AdminShadowingStatus }))}
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicada</option>
              </select>
            </label>
          </div>

          <div className="admin-topbar-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn primary" onClick={handleSaveList} disabled={isSavingList}>
              {isSavingList ? 'Guardando...' : editingListId ? 'Actualizar lista' : 'Crear lista'}
            </button>
            {editingListId && (
              <button type="button" className="btn ghost" onClick={resetListForm} disabled={isSavingList}>
                Cancelar
              </button>
            )}
          </div>

          <div className="admin-session-list admin-shadowing-list">
            {lists.map((list) => {
              const coverUploading = uploadingKey === listCoverKey(list)

              return (
                <div key={list.listId} className={`admin-session-item admin-shadowing-list-card${selectedListId === list.listId ? ' admin-session-item-highlight' : ''}`}>
                  <div className="admin-shadowing-list-card-main">
                    {list.coverImageUrl ? (
                      <img
                        src={list.coverImageUrl}
                        alt=""
                        className="admin-shadowing-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="admin-shadowing-cover admin-shadowing-cover-empty"
                      />
                    )}
                    <div className="admin-shadowing-list-card-copy">
                      <span>{list.category}</span>
                      <strong>{list.name}</strong>
                      <p>{list.chapters.length} capitulos · orden {list.order}</p>
                    </div>
                  </div>
                  <div className="admin-shadowing-card-actions">
                    <button type="button" className="btn secondary" onClick={() => setSelectedListId(list.listId)}>
                      Ver
                    </button>
                    <label className="btn secondary admin-file-button">
                      {coverUploading ? 'Subiendo cover...' : list.coverImageUrl ? 'Reemplazar cover' : 'Subir cover'}
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        style={{ display: 'none' }}
                        disabled={Boolean(uploadingKey)}
                        onChange={(event) => {
                          void handleCoverSelected(list, event.target.files?.[0])
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>
                    {list.coverImageUrl && (
                      <a className="btn ghost" href={list.coverImageUrl} target="_blank" rel="noreferrer">
                        Ver cover
                      </a>
                    )}
                    <button type="button" className="btn ghost" onClick={() => handleEditList(list)}>
                      Editar
                    </button>
                    <button type="button" className="btn ghost" onClick={() => { void handleDeleteList(list) }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">{editingChapterId ? 'Editar capitulo' : 'Nuevo capitulo'}</p>
            <h3>{selectedList ? selectedList.name : 'Selecciona una lista'}</h3>
          </div>

          <div className="admin-asset-form">
            <label className="admin-grant-field">
              <span>Lista</span>
              <select
                value={chapterForm.listId || selectedList?.listId || ''}
                onChange={(event) => {
                  setSelectedListId(event.target.value)
                  setChapterForm((form) => ({ ...form, listId: event.target.value }))
                }}
                disabled={!lists.length}
              >
                {lists.map((list) => (
                  <option key={list.listId} value={list.listId}>
                    {list.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-grant-field">
              <span>Titulo</span>
              <input
                type="text"
                value={chapterForm.title}
                onChange={(event) => setChapterForm((form) => ({ ...form, title: event.target.value }))}
                placeholder="Ej. Ordering coffee"
              />
            </label>
            <label className="admin-grant-field">
              <span>Descripcion</span>
              <textarea
                rows={4}
                value={chapterForm.description}
                onChange={(event) => setChapterForm((form) => ({ ...form, description: event.target.value }))}
                placeholder="Describe que practicara el alumno con este audio."
              />
            </label>
            <label className="admin-grant-field">
              <span>Orden</span>
              <input
                type="number"
                min="1"
                value={chapterForm.order}
                onChange={(event) => setChapterForm((form) => ({ ...form, order: event.target.value }))}
              />
            </label>
            <label className="admin-grant-field">
              <span>Duracion en segundos</span>
              <input
                type="number"
                min="1"
                value={chapterForm.durationSeconds}
                onChange={(event) => setChapterForm((form) => ({ ...form, durationSeconds: event.target.value }))}
                placeholder="Opcional"
              />
            </label>
            <label className="admin-grant-field">
              <span>Estado</span>
              <select
                value={chapterForm.status}
                onChange={(event) => setChapterForm((form) => ({ ...form, status: event.target.value as AdminShadowingChapterStatus }))}
              >
                <option value="draft">Borrador</option>
                <option value="ready">Listo</option>
              </select>
            </label>
          </div>

          <div className="admin-topbar-actions" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn primary"
              onClick={handleSaveChapter}
              disabled={isSavingChapter || !lists.length}
            >
              {isSavingChapter ? 'Guardando...' : editingChapterId ? 'Actualizar capitulo' : 'Crear capitulo'}
            </button>
            {editingChapterId && (
              <button type="button" className="btn ghost" onClick={resetChapterForm} disabled={isSavingChapter}>
                Cancelar
              </button>
            )}
          </div>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <p className="eyebrow">Catalogo</p>
          <h3>Capitulos y audios</h3>
        </div>

        {isLoading && !data ? (
          <div className="admin-empty-state admin-empty-state-compact">
            <p>Cargando Shadowing...</p>
          </div>
        ) : !selectedList ? (
          <div className="admin-empty-state admin-empty-state-compact">
            <strong>Sin listas todavia</strong>
            <p>Crea la primera lista para empezar a cargar capitulos.</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="admin-empty-state admin-empty-state-compact">
            <strong>Sin capitulos en esta lista</strong>
            <p>Crea un capitulo y despues sube su audio.</p>
          </div>
        ) : (
          <div className="admin-shadowing-chapter-list">
            {chapters.map((chapter) => {
              const audioUploading = uploadingKey === chapterKey(chapter)
              const subtitlesUploading = uploadingKey === `${chapterKey(chapter)}:subtitles`
              const subtitlesGenerating = generatingSubtitlesKey === chapterKey(chapter)

              return (
                <div key={chapter.chapterId} className="admin-shadowing-chapter-card">
                  <div className="admin-shadowing-chapter-main">
                    <div className="admin-shadowing-chapter-title">
                      <div>
                        <strong>{chapter.title}</strong>
                        <p>{chapter.description || 'Sin descripcion'}</p>
                      </div>
                      <span className={`admin-lesson-status-badge admin-lesson-status-${chapter.status === 'ready' ? 'ready' : 'draft'}`}>
                        {chapter.status === 'ready' ? 'Listo' : 'Borrador'}
                      </span>
                    </div>

                    <div className="admin-shadowing-chapter-meta">
                      <span>Orden {chapter.order}</span>
                      <span>Actualizado {formatDateTime(chapter.updatedAt)}</span>
                      {chapter.assetsBucketName && <span>Bucket {chapter.assetsBucketName}</span>}
                    </div>

                    <div className="admin-shadowing-assets">
                      {chapter.audioUrl && <span className="tag">Audio</span>}
                      {chapter.subtitlesUrl && <span className="tag">Subtitulos</span>}
                      {chapter.durationSeconds && <span className="tag">{chapter.durationSeconds}s</span>}
                    </div>
                  </div>

                  <div className="admin-shadowing-card-actions">
                    <label className="btn secondary admin-file-button">
                      {audioUploading ? 'Subiendo audio...' : chapter.audioUrl ? 'Reemplazar audio' : 'Subir audio'}
                      <input
                        type="file"
                        accept={AUDIO_ACCEPT}
                        style={{ display: 'none' }}
                        disabled={Boolean(uploadingKey)}
                        onChange={(event) => {
                          void handleAudioSelected(chapter, event.target.files?.[0])
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>
                    {chapter.audioUrl && (
                      <a className="btn ghost" href={chapter.audioUrl} target="_blank" rel="noreferrer">
                        Escuchar audio
                      </a>
                    )}
                    <label className="btn secondary admin-file-button">
                      {subtitlesUploading ? 'Subiendo subtitulos...' : chapter.subtitlesUrl ? 'Reemplazar subtitulos' : 'Subir subtitulos'}
                      <input
                        type="file"
                        accept={SUBTITLES_ACCEPT}
                        style={{ display: 'none' }}
                        disabled={Boolean(uploadingKey) || Boolean(generatingSubtitlesKey)}
                        onChange={(event) => {
                          void handleSubtitlesSelected(chapter, event.target.files?.[0])
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={!chapter.audioUrl || Boolean(uploadingKey) || Boolean(generatingSubtitlesKey)}
                      onClick={() => { void handleGenerateSubtitles(chapter) }}
                    >
                      {subtitlesGenerating ? 'Generando...' : 'Generar con Whisper'}
                    </button>
                    {chapter.subtitlesUrl && (
                      <a className="btn ghost" href={chapter.subtitlesUrl} target="_blank" rel="noreferrer">
                        Ver subtitulos
                      </a>
                    )}
                    <button type="button" className="btn ghost" onClick={() => handleEditChapter(chapter)}>
                      Editar
                    </button>
                    <button type="button" className="btn ghost" onClick={() => { void handleDeleteChapter(chapter) }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </AdminLayout>
  )
}
