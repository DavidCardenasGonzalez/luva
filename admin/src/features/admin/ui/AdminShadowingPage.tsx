import { useEffect, useMemo, useState } from 'react'
import {
  completeShadowingAudioUpload,
  createAdminShadowingChapter,
  createAdminShadowingList,
  createShadowingAudioUpload,
  deleteAdminShadowingChapter,
  deleteAdminShadowingList,
  updateAdminShadowingChapter,
  updateAdminShadowingList,
} from '@/features/admin/api/admin-client'
import type {
  AdminShadowingAudioKind,
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

async function uploadAudioFile(
  chapter: AdminShadowingChapter,
  kind: AdminShadowingAudioKind,
  file: File,
) {
  const upload = await createShadowingAudioUpload(
    chapter.listId,
    chapter.chapterId,
    kind,
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

  await completeShadowingAudioUpload(chapter.listId, chapter.chapterId, kind, upload.key)
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
    kind: AdminShadowingAudioKind,
    file?: File,
  ) => {
    if (!file) return

    const key = `${chapterKey(chapter)}:${kind}`
    setUploadingKey(key)
    setUploadError(undefined)

    try {
      await uploadAudioFile(chapter, kind, file)
      reload()
    } catch (audioError) {
      setUploadError(audioError instanceof Error ? audioError.message : 'No pudimos subir el audio.')
    } finally {
      setUploadingKey(undefined)
    }
  }

  return (
    <AdminLayout
      title="Shadowing"
      description="Administra listas y capitulos de practica con audios en ingles y espanol."
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
          <span className="eyebrow">Con audio EN</span>
          <strong>{lists.reduce((total, list) => total + list.chapters.filter((chapter) => chapter.audioUrl).length, 0)}</strong>
          <p>El audio en ingles marca el capitulo como listo.</p>
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

          <div className="admin-session-list" style={{ marginTop: 18 }}>
            {lists.map((list) => (
              <div key={list.listId} className="admin-session-item">
                <span>{list.category}</span>
                <strong>{list.name}</strong>
                <p>{list.chapters.length} capitulos · orden {list.order}</p>
                <div className="admin-topbar-actions" style={{ marginTop: 10 }}>
                  <button type="button" className="btn secondary" onClick={() => setSelectedListId(list.listId)}>
                    Ver
                  </button>
                  <button type="button" className="btn ghost" onClick={() => handleEditList(list)}>
                    Editar
                  </button>
                  <button type="button" className="btn ghost" onClick={() => { void handleDeleteList(list) }}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
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
            <p>Crea un capitulo y despues sube sus audios.</p>
          </div>
        ) : (
          <div className="admin-lesson-list">
            {chapters.map((chapter) => {
              const audioUploading = uploadingKey === `${chapterKey(chapter)}:audio`
              const spanishUploading = uploadingKey === `${chapterKey(chapter)}:spanishAudio`

              return (
                <div key={chapter.chapterId} className="admin-lesson-row">
                  <div className="admin-lesson-row-main">
                    <div className="admin-lesson-row-copy">
                      <div className="admin-lesson-row-headline">
                        <strong>{chapter.title}</strong>
                        <span className={`admin-lesson-status-badge admin-lesson-status-${chapter.status === 'ready' ? 'ready' : 'draft'}`}>
                          {chapter.status === 'ready' ? 'Listo' : 'Borrador'}
                        </span>
                      </div>
                      <p>{chapter.description || 'Sin descripcion'}</p>
                      <p>
                        Orden {chapter.order} · actualizado {formatDateTime(chapter.updatedAt)}
                        {chapter.assetsBucketName ? ` · bucket ${chapter.assetsBucketName}` : ''}
                      </p>
                    </div>

                    <div className="admin-lesson-row-assets">
                      {chapter.audioUrl && <span className="tag">Audio EN</span>}
                      {chapter.spanishAudioUrl && <span className="tag">Audio ES</span>}
                      {chapter.durationSeconds && <span className="tag">{chapter.durationSeconds}s</span>}
                    </div>
                  </div>

                  <div className="admin-topbar-actions">
                    <label className="btn secondary" style={{ cursor: 'pointer' }}>
                      {audioUploading ? 'Subiendo EN...' : chapter.audioUrl ? 'Reemplazar EN' : 'Subir EN'}
                      <input
                        type="file"
                        accept={AUDIO_ACCEPT}
                        style={{ display: 'none' }}
                        disabled={Boolean(uploadingKey)}
                        onChange={(event) => {
                          void handleAudioSelected(chapter, 'audio', event.target.files?.[0])
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>
                    <label className="btn secondary" style={{ cursor: 'pointer' }}>
                      {spanishUploading ? 'Subiendo ES...' : chapter.spanishAudioUrl ? 'Reemplazar ES' : 'Subir ES'}
                      <input
                        type="file"
                        accept={AUDIO_ACCEPT}
                        style={{ display: 'none' }}
                        disabled={Boolean(uploadingKey)}
                        onChange={(event) => {
                          void handleAudioSelected(chapter, 'spanishAudio', event.target.files?.[0])
                          event.currentTarget.value = ''
                        }}
                      />
                    </label>
                    {chapter.audioUrl && (
                      <a className="btn ghost" href={chapter.audioUrl} target="_blank" rel="noreferrer">
                        Escuchar EN
                      </a>
                    )}
                    {chapter.spanishAudioUrl && (
                      <a className="btn ghost" href={chapter.spanishAudioUrl} target="_blank" rel="noreferrer">
                        Escuchar ES
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
