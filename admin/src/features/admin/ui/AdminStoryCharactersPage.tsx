import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { useAdminStoryCharacters } from '@/features/admin/model/use-admin-story-characters'
import type { AdminStoryCharacter } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'
import {
  createAdminAssetUpload,
  createAdminAvatarVariantUploads,
  purgeAdminCharacter,
  type AdminCharacterPurgeResponse,
} from '@/features/admin/api/admin-client'

function getInitials(character: AdminStoryCharacter) {
  return (character.characterName.trim().charAt(0) || '?').toUpperCase()
}

function matchesSearch(character: AdminStoryCharacter, search: string) {
  const normalized = search.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return [character.characterName, character.characterId]
    .join(' ')
    .toLowerCase()
    .includes(normalized)
}

type NewCharacterForm = {
  characterId: string
  storyIsInitial: boolean
  characterTags: string
  aiRole: string
  caracterName: string
  caracterPrompt: string
  characterBio: string
  avatarImageUrl: string
  avatarImageXsUrl: string
  avatarImageMdUrl: string
}

const EMPTY_NEW_CHARACTER: NewCharacterForm = {
  characterId: '',
  storyIsInitial: false,
  characterTags: '',
  aiRole: '',
  caracterName: '',
  caracterPrompt: '',
  characterBio: '',
  avatarImageUrl: '',
  avatarImageXsUrl: '',
  avatarImageMdUrl: '',
}

function buildCharacterJson(form: NewCharacterForm): string {
  const ordered: Record<string, unknown> = {}
  ordered.characterId = form.characterId.trim()
  if (form.storyIsInitial) ordered.storyIsInitial = true
  const tags = form.characterTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  if (tags.length) ordered.characterTags = tags
  ordered.aiRole = form.aiRole.trim()
  if (form.caracterName.trim()) ordered.caracterName = form.caracterName.trim()
  if (form.caracterPrompt.trim()) ordered.caracterPrompt = form.caracterPrompt.trim()
  if (form.characterBio.trim()) ordered.characterBio = form.characterBio.trim()
  if (form.avatarImageUrl.trim()) ordered.avatarImageUrl = form.avatarImageUrl.trim()
  if (form.avatarImageXsUrl.trim()) ordered.avatarImageXsUrl = form.avatarImageXsUrl.trim()
  if (form.avatarImageMdUrl.trim()) ordered.avatarImageMdUrl = form.avatarImageMdUrl.trim()
  const body = JSON.stringify(ordered, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : `  ${line}`))
    .join('\n')
  return `  ${body},`
}

export function AdminStoryCharactersPage() {
  const navigate = useNavigate()
  const { data, error, isLoading, reload } = useAdminStoryCharacters()
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<AdminStoryCharacter | null>(null)
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | undefined>()
  const [deleteResult, setDeleteResult] = useState<AdminCharacterPurgeResponse | undefined>()
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [newCharacter, setNewCharacter] = useState<NewCharacterForm>(EMPTY_NEW_CHARACTER)
  const [generatedJson, setGeneratedJson] = useState<string | undefined>()
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [avatarFile, setAvatarFile] = useState<File | undefined>()
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | undefined>()
  const [avatarStage, setAvatarStage] = useState<string | undefined>()
  const [avatarError, setAvatarError] = useState<string | undefined>()
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [bulkDeleteConfirmInput, setBulkDeleteConfirmInput] = useState('')
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | undefined>()
  const [bulkDeletedIds, setBulkDeletedIds] = useState<string[] | undefined>()
  const [bulkFailedIds, setBulkFailedIds] = useState<string[] | undefined>()
  const [bulkCopyState, setBulkCopyState] = useState<'idle' | 'copied'>('idle')

  const characters = useMemo(() => data?.characters || [], [data?.characters])
  const filteredCharacters = useMemo(
    () => characters.filter((character) => matchesSearch(character, search)),
    [characters, search],
  )
  const avatarCount = characters.filter((character) => character.avatarImageUrl).length

  function openDeleteModal(character: AdminStoryCharacter) {
    setPendingDelete(character)
    setDeleteConfirmInput('')
    setDeleteError(undefined)
    setDeleteResult(undefined)
  }

  function closeDeleteModal() {
    if (isDeleting) return
    setPendingDelete(null)
    setDeleteConfirmInput('')
    setDeleteError(undefined)
  }

  function resetAvatarUpload() {
    setAvatarFile(undefined)
    setAvatarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return undefined
    })
    setAvatarStage(undefined)
    setAvatarError(undefined)
    setIsUploadingAvatar(false)
  }

  function openNewModal() {
    setNewCharacter(EMPTY_NEW_CHARACTER)
    setGeneratedJson(undefined)
    setCopyState('idle')
    resetAvatarUpload()
    setIsNewOpen(true)
  }

  function closeNewModal() {
    if (isUploadingAvatar) return
    setIsNewOpen(false)
    resetAvatarUpload()
  }

  function handleAvatarFileChange(file: File | undefined) {
    setAvatarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : undefined
    })
    setAvatarFile(file)
    setAvatarError(undefined)
    setAvatarStage(undefined)
  }

  async function handleUploadAvatar() {
    if (!avatarFile) {
      setAvatarError('Selecciona una imagen primero.')
      return
    }

    setIsUploadingAvatar(true)
    setAvatarError(undefined)
    if (generatedJson) {
      setGeneratedJson(undefined)
      setCopyState('idle')
    }

    try {
      setAvatarStage('Preparando URL de carga...')
      const original = await createAdminAssetUpload(
        'storiesProfile',
        avatarFile.type || 'image/png',
        avatarFile.name,
      )

      setAvatarStage('Subiendo original a S3...')
      const originalResponse = await fetch(original.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': original.contentType,
          ...(original.cacheControl ? { 'Cache-Control': original.cacheControl } : {}),
        },
        body: avatarFile,
      })
      if (!originalResponse.ok) {
        throw new Error(`No pudimos subir el original. HTTP ${originalResponse.status}`)
      }

      setAvatarStage('Generando variantes 96px y 512px...')
      const [xsBlob, mdBlob] = await Promise.all([
        resizeImageToWebp(avatarFile, 96, 0.75),
        resizeImageToWebp(avatarFile, 512, 0.82),
      ])

      setAvatarStage('Pidiendo URLs firmadas para variantes...')
      const variantUploads = await createAdminAvatarVariantUploads(original.key)
      const xsTarget = variantUploads.variants.find((variant) => variant.field === 'avatarImageXsUrl')
      const mdTarget = variantUploads.variants.find((variant) => variant.field === 'avatarImageMdUrl')
      if (!xsTarget || !mdTarget) {
        throw new Error('Respuesta de variantes incompleta.')
      }

      setAvatarStage('Subiendo variantes a S3...')
      await Promise.all([
        fetch(xsTarget.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': xsTarget.contentType,
            ...(xsTarget.cacheControl ? { 'Cache-Control': xsTarget.cacheControl } : {}),
          },
          body: xsBlob,
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Falló la variante xs (HTTP ${response.status}).`)
          }
        }),
        fetch(mdTarget.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': mdTarget.contentType,
            ...(mdTarget.cacheControl ? { 'Cache-Control': mdTarget.cacheControl } : {}),
          },
          body: mdBlob,
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Falló la variante md (HTTP ${response.status}).`)
          }
        }),
      ])

      setNewCharacter((prev) => ({
        ...prev,
        avatarImageUrl: original.url,
        avatarImageXsUrl: xsTarget.url,
        avatarImageMdUrl: mdTarget.url,
      }))
      setAvatarStage('Listo: 3 URLs guardadas en el formulario.')
    } catch (uploadError) {
      setAvatarError(
        uploadError instanceof Error
          ? uploadError.message
          : 'No pudimos subir la imagen del avatar.',
      )
      setAvatarStage(undefined)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  function updateNewField<K extends keyof NewCharacterForm>(key: K, value: NewCharacterForm[K]) {
    setNewCharacter((prev) => ({ ...prev, [key]: value }))
    if (generatedJson) {
      setGeneratedJson(undefined)
      setCopyState('idle')
    }
  }

  function handleGenerateJson() {
    setGeneratedJson(buildCharacterJson(newCharacter))
    setCopyState('idle')
  }

  async function handleCopyJson() {
    if (!generatedJson) return
    try {
      await navigator.clipboard.writeText(generatedJson)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('idle')
    }
  }

  const canGenerate =
    newCharacter.characterId.trim().length > 0 && newCharacter.aiRole.trim().length > 0

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    if (deleteConfirmInput.trim() !== pendingDelete.characterId) return
    setIsDeleting(true)
    setDeleteError(undefined)
    try {
      const result = await purgeAdminCharacter(pendingDelete.characterId)
      setDeleteResult(result)
      await reload()
    } catch (err: any) {
      setDeleteError(err?.message || 'No pudimos eliminar al personaje.')
    } finally {
      setIsDeleting(false)
    }
  }

  function toggleSelected(characterId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(characterId)) {
        next.delete(characterId)
      } else {
        next.add(characterId)
      }
      return next
    })
  }

  const filteredIds = useMemo(
    () => filteredCharacters.map((character) => character.characterId),
    [filteredCharacters],
  )
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id))
  const someFilteredSelected =
    filteredIds.some((id) => selectedIds.has(id)) && !allFilteredSelected

  function toggleSelectAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        for (const id of filteredIds) next.delete(id)
      } else {
        for (const id of filteredIds) next.add(id)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function openBulkDeleteModal() {
    if (selectedIds.size === 0) return
    setBulkDeleteConfirmInput('')
    setBulkDeleteError(undefined)
    setBulkDeletedIds(undefined)
    setBulkFailedIds(undefined)
    setBulkCopyState('idle')
    setIsBulkDeleteOpen(true)
  }

  function closeBulkDeleteModal() {
    if (isBulkDeleting) return
    setIsBulkDeleteOpen(false)
    setBulkDeleteConfirmInput('')
    setBulkDeleteError(undefined)
  }

  async function handleConfirmBulkDelete() {
    if (bulkDeleteConfirmInput.trim().toUpperCase() !== 'BORRAR') return
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    setIsBulkDeleting(true)
    setBulkDeleteError(undefined)
    const succeeded: string[] = []
    const failed: string[] = []

    for (const id of ids) {
      try {
        await purgeAdminCharacter(id)
        succeeded.push(id)
      } catch {
        failed.push(id)
      }
    }

    setBulkDeletedIds(succeeded)
    setBulkFailedIds(failed)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of succeeded) next.delete(id)
      return next
    })
    if (failed.length > 0) {
      setBulkDeleteError(`${failed.length} personaje(s) no se pudieron eliminar.`)
    }
    try {
      await reload()
    } catch {
      // ignore reload error; results already captured
    }
    setIsBulkDeleting(false)
  }

  async function handleCopyBulkIds() {
    if (!bulkDeletedIds) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(bulkDeletedIds, null, 2))
      setBulkCopyState('copied')
      setTimeout(() => setBulkCopyState('idle'), 1500)
    } catch {
      setBulkCopyState('idle')
    }
  }

  return (
    <AdminLayout
      title="Personajes"
      description="Administra los perfiles de personajes. Cada personaje aparece como una fila con su avatar."
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn primary" onClick={openNewModal}>
            Nuevo personaje
          </button>
          <button type="button" className="btn secondary" onClick={reload} disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Recargar personajes'}
          </button>
        </div>
      }
    >
      <section className="admin-video-summary-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Personajes</span>
          <strong>{characters.length}</strong>
          <p>Personajes disponibles para crear perfiles tipo Instagram.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Con avatar</span>
          <strong>{avatarCount}</strong>
          <p>Personajes con imagen lista para mostrarse en la fila.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Filtro</span>
          <strong>{filteredCharacters.length}</strong>
          <p>Resultados visibles con la busqueda actual.</p>
        </article>
      </section>

      {error && (
        <section className="admin-inline-alert">
          <p>{error}</p>
        </section>
      )}

      <section className="admin-panel admin-story-character-panel">
        <div className="admin-users-toolbar">
          <div className="admin-panel-head">
            <p className="eyebrow">Catálogo</p>
            <h3>Personajes</h3>
          </div>

          <label className="admin-search-field">
            <span>Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o id de personaje"
            />
          </label>
        </div>

        {filteredCharacters.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
              fontSize: 13,
              color: '#475569',
            }}
          >
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={(node) => {
                if (node) node.indeterminate = someFilteredSelected
              }}
              onChange={toggleSelectAllFiltered}
            />
            <span>
              {allFilteredSelected ? 'Quitar selección visible' : 'Seleccionar todo lo visible'}
              {selectedIds.size > 0 && ` · ${selectedIds.size} marcados`}
            </span>
          </div>
        )}

        <div
          className="admin-story-character-list"
          style={{ paddingBottom: selectedIds.size > 0 ? 72 : undefined }}
        >
          {filteredCharacters.map((character) => {
            const isChecked = selectedIds.has(character.characterId)
            return (
              <div
                key={character.characterId}
                className="admin-story-character-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: isChecked ? '#eff6ff' : undefined,
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelected(character.characterId)}
                  aria-label={`Seleccionar ${character.characterName}`}
                />
                <button
                  type="button"
                  onClick={() => navigate(appPaths.character(character.characterId))}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span className="admin-story-character-avatar">
                    {character.avatarImageUrl ? (
                      <img src={character.avatarImageUrl} alt="" />
                    ) : (
                      <span>{getInitials(character)}</span>
                    )}
                  </span>

                  <span className="admin-story-character-copy">
                    <strong>{character.characterName}</strong>
                    <small>{character.characterId}</small>
                  </span>
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={(event) => {
                    event.stopPropagation()
                    openDeleteModal(character)
                  }}
                >
                  Eliminar
                </button>
              </div>
            )
          })}

          {!filteredCharacters.length && (
            <div className="admin-empty-state admin-empty-state-compact">
              <strong>No hay personajes para mostrar.</strong>
              <p>Cambia la busqueda o recarga el catalogo de personajes.</p>
            </div>
          )}
        </div>
      </section>

      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            background: '#0f172a',
            color: '#f8fafc',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'space-between',
            boxShadow: '0 -8px 24px rgba(15, 23, 42, 0.35)',
            zIndex: 900,
          }}
        >
          <div style={{ fontSize: 14 }}>
            <strong>{selectedIds.size}</strong> personaje(s) seleccionado(s)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn secondary" onClick={clearSelection}>
              Limpiar
            </button>
            <button type="button" className="btn danger" onClick={openBulkDeleteModal}>
              Borrar seleccionados
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
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
          }}
          onClick={closeDeleteModal}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: '#fff',
              color: '#0f172a',
              borderRadius: 16,
              padding: 24,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20 }}>
              Eliminar personaje
            </h3>
            <p style={{ marginTop: 8 }}>
              Esta acción borrará <strong>permanentemente</strong>:
            </p>
            <ul style={{ marginTop: 4, paddingLeft: 20, color: '#475569' }}>
              <li>Posts del personaje y sus assets en S3</li>
              <li>Videos generados y sus archivos en S3</li>
              <li>Friendships de cualquier usuario con este personaje</li>
              <li>Entradas de progreso en todos los usuarios</li>
            </ul>
            <p style={{ marginTop: 12, color: '#64748b' }}>
              Recuerda quitar el personaje del archivo <code>characters.ts</code> después de
              ejecutar esto. Para confirmar, escribe el <strong>characterId</strong> exacto abajo.
            </p>
            <code
              style={{
                display: 'block',
                marginTop: 8,
                padding: '8px 12px',
                background: '#f1f5f9',
                borderRadius: 8,
                fontSize: 13,
                wordBreak: 'break-all',
              }}
            >
              {pendingDelete.characterId}
            </code>
            <input
              autoFocus
              value={deleteConfirmInput}
              onChange={(event) => setDeleteConfirmInput(event.target.value)}
              placeholder="Escribe el characterId aquí"
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'monospace',
              }}
              disabled={isDeleting || !!deleteResult}
            />

            {deleteError && (
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
                {deleteError}
              </p>
            )}

            {deleteResult && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#ecfdf5',
                  color: '#065f46',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <strong>Personaje eliminado.</strong>
                <ul style={{ marginTop: 6, paddingLeft: 18, lineHeight: 1.6 }}>
                  <li>Posts: {deleteResult.posts.deleted} de {deleteResult.posts.scanned}</li>
                  <li>Videos: {deleteResult.videos.deleted} de {deleteResult.videos.scanned}</li>
                  <li>
                    Friendships: {deleteResult.friendships.deleted} de {deleteResult.friendships.scanned}
                  </li>
                  <li>
                    Usuarios actualizados: {deleteResult.userProgress.updated} de{' '}
                    {deleteResult.userProgress.scanned}
                  </li>
                  <li>
                    S3 (assets): {deleteResult.s3.assets} · S3 (videos): {deleteResult.s3.videos}
                    {deleteResult.s3.failures > 0 && ` · ${deleteResult.s3.failures} fallos`}
                  </li>
                </ul>
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn secondary"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                {deleteResult ? 'Cerrar' : 'Cancelar'}
              </button>
              {!deleteResult && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={handleConfirmDelete}
                  disabled={
                    isDeleting || deleteConfirmInput.trim() !== pendingDelete.characterId
                  }
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isBulkDeleteOpen && (
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
          onClick={closeBulkDeleteModal}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: '#fff',
              color: '#0f172a',
              borderRadius: 16,
              padding: 24,
              maxWidth: 560,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20 }}>Borrado masivo</h3>
            <p style={{ marginTop: 8, color: '#475569', fontSize: 13 }}>
              Vas a eliminar <strong>{selectedIds.size}</strong> personaje(s). Esta acción borrará
              permanentemente posts, videos, friendships y entradas de progreso de cada uno.
              Recuerda quitarlos también de <code>characters.ts</code>.
            </p>

            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: '#f8fafc',
                borderRadius: 8,
                maxHeight: 220,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            >
              {Array.from(selectedIds).map((id) => (
                <div key={id} style={{ wordBreak: 'break-all' }}>
                  {id}
                </div>
              ))}
            </div>

            {!bulkDeletedIds && (
              <>
                <p style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>
                  Para confirmar, escribe <strong>BORRAR</strong> abajo.
                </p>
                <input
                  autoFocus
                  value={bulkDeleteConfirmInput}
                  onChange={(event) => setBulkDeleteConfirmInput(event.target.value)}
                  placeholder="BORRAR"
                  style={{
                    marginTop: 6,
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 14,
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                  disabled={isBulkDeleting}
                />
              </>
            )}

            {bulkDeleteError && (
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
                {bulkDeleteError}
              </p>
            )}

            {bulkDeletedIds && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#ecfdf5',
                  color: '#065f46',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <strong>
                  {bulkDeletedIds.length} personaje(s) eliminado(s)
                  {bulkFailedIds && bulkFailedIds.length > 0
                    ? ` · ${bulkFailedIds.length} fallaron`
                    : ''}
                  .
                </strong>
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#047857' }}>
                    characterIds eliminados (JSON)
                  </span>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => void handleCopyBulkIds()}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    {bulkCopyState === 'copied' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    overflow: 'auto',
                    margin: '6px 0 0 0',
                  }}
                >
                  {JSON.stringify(bulkDeletedIds, null, 2)}
                </pre>
                {bulkFailedIds && bulkFailedIds.length > 0 && (
                  <>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#7f1d1d' }}>
                      Fallaron:
                    </div>
                    <pre
                      style={{
                        background: '#fee2e2',
                        color: '#7f1d1d',
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 12,
                        overflow: 'auto',
                        margin: '4px 0 0 0',
                      }}
                    >
                      {JSON.stringify(bulkFailedIds, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn secondary"
                onClick={closeBulkDeleteModal}
                disabled={isBulkDeleting}
              >
                {bulkDeletedIds ? 'Cerrar' : 'Cancelar'}
              </button>
              {!bulkDeletedIds && (
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => void handleConfirmBulkDelete()}
                  disabled={
                    isBulkDeleting ||
                    bulkDeleteConfirmInput.trim().toUpperCase() !== 'BORRAR' ||
                    selectedIds.size === 0
                  }
                >
                  {isBulkDeleting ? 'Eliminando...' : `Eliminar ${selectedIds.size}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isNewOpen && (
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
          onClick={closeNewModal}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: '#fff',
              color: '#0f172a',
              borderRadius: 16,
              padding: 24,
              maxWidth: 680,
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20 }}>Nuevo personaje</h3>
            <p style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>
              Completa el formulario y genera el JSON listo para pegar en{' '}
              <code>backend/src/data/characters.ts</code>.
            </p>

            <div
              style={{
                marginTop: 16,
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 12,
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                  characterId *
                </span>
                <input
                  value={newCharacter.characterId}
                  onChange={(event) => updateNewField('characterId', event.target.value)}
                  placeholder="initials:meet_someone_first_mission"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={newCharacter.storyIsInitial}
                  onChange={(event) => updateNewField('storyIsInitial', event.target.checked)}
                />
                <span style={{ fontSize: 13, color: '#334155' }}>storyIsInitial</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                  characterTags (separados por coma)
                </span>
                <input
                  value={newCharacter.characterTags}
                  onChange={(event) => updateNewField('characterTags', event.target.value)}
                  placeholder="dating, conversation, funny"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>aiRole *</span>
                <textarea
                  value={newCharacter.aiRole}
                  onChange={(event) => updateNewField('aiRole', event.target.value)}
                  placeholder="Eres ..."
                  rows={4}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                  caracterName
                </span>
                <input
                  value={newCharacter.caracterName}
                  onChange={(event) => updateNewField('caracterName', event.target.value)}
                  placeholder="Mateo"
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                  caracterPrompt
                </span>
                <textarea
                  value={newCharacter.caracterPrompt}
                  onChange={(event) => updateNewField('caracterPrompt', event.target.value)}
                  placeholder="A charismatic and warm man..."
                  rows={4}
                  style={inputStyle}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                  characterBio
                </span>
                <textarea
                  value={newCharacter.characterBio}
                  onChange={(event) => updateNewField('characterBio', event.target.value)}
                  placeholder="Amigo carismático y espontáneo..."
                  rows={3}
                  style={inputStyle}
                />
              </label>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: 12,
                  borderRadius: 8,
                  border: '1px dashed #cbd5e1',
                  background: '#f8fafc',
                }}
              >
                <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                  Imagen del avatar
                </span>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Sube una imagen y se generan automaticamente las 3 URLs (original + xs 96px +
                  md 512px) en <code>storiesProfile/</code>.
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif,image/heic,image/heif"
                  disabled={isUploadingAvatar}
                  onChange={(event) => handleAvatarFileChange(event.target.files?.[0])}
                />

                {avatarPreviewUrl && (
                  <img
                    src={avatarPreviewUrl}
                    alt="Vista previa"
                    style={{
                      maxWidth: 160,
                      maxHeight: 160,
                      borderRadius: 8,
                      objectFit: 'cover',
                    }}
                  />
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={() => void handleUploadAvatar()}
                    disabled={!avatarFile || isUploadingAvatar}
                  >
                    {isUploadingAvatar ? 'Subiendo...' : 'Subir imagen y generar URLs'}
                  </button>
                </div>

                {avatarStage && (
                  <p style={{ margin: 0, fontSize: 12, color: '#0f172a' }}>{avatarStage}</p>
                )}
                {avatarError && (
                  <p
                    style={{
                      margin: 0,
                      padding: '6px 10px',
                      background: '#fef2f2',
                      color: '#991b1b',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    {avatarError}
                  </p>
                )}

                {(newCharacter.avatarImageUrl ||
                  newCharacter.avatarImageXsUrl ||
                  newCharacter.avatarImageMdUrl) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    {(
                      [
                        ['avatarImageUrl', newCharacter.avatarImageUrl] as const,
                        ['avatarImageXsUrl', newCharacter.avatarImageXsUrl] as const,
                        ['avatarImageMdUrl', newCharacter.avatarImageMdUrl] as const,
                      ]
                    ).map(([field, value]) => (
                      <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                          {field}
                        </span>
                        <code
                          style={{
                            fontSize: 11,
                            color: '#0f172a',
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: '4px 6px',
                            wordBreak: 'break-all',
                          }}
                        >
                          {value || '(pendiente)'}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {generatedJson && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    JSON para characters.ts
                  </span>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={handleCopyJson}
                    style={{ padding: '4px 10px', fontSize: 12 }}
                  >
                    {copyState === 'copied' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <pre
                  style={{
                    background: '#0f172a',
                    color: '#e2e8f0',
                    padding: 12,
                    borderRadius: 8,
                    fontSize: 12,
                    overflow: 'auto',
                    margin: 0,
                    whiteSpace: 'pre',
                  }}
                >
                  {generatedJson}
                </pre>
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn secondary" onClick={closeNewModal}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={handleGenerateJson}
                disabled={!canGenerate}
              >
                Generar JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

async function resizeImageToWebp(file: File, maxSize: number, quality: number): Promise<Blob> {
  const bitmap = await loadImageBitmap(file)
  try {
    const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const targetWidth = Math.max(1, Math.round(bitmap.width * ratio))
    const targetHeight = Math.max(1, Math.round(bitmap.height * ratio))
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Tu navegador no soporta canvas 2D.')
    }
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('No se pudo generar la variante webp.'))
            return
          }
          resolve(blob)
        },
        'image/webp',
        quality,
      )
    })
  } finally {
    if ('close' in bitmap && typeof bitmap.close === 'function') {
      bitmap.close()
    }
  }
}

async function loadImageBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // fall through to <img> fallback
    }
  }
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = objectUrl
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
    })
    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}
