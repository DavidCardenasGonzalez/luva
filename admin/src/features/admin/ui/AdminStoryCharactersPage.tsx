import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { useAdminStoryCharacters } from '@/features/admin/model/use-admin-story-characters'
import type { AdminStoryCharacter } from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

function getInitials(character: AdminStoryCharacter) {
  return (character.characterName.trim().charAt(0) || '?').toUpperCase()
}

function matchesSearch(character: AdminStoryCharacter, search: string) {
  const normalized = search.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return [
    character.characterName,
    character.storyTitle,
    character.missionTitle,
    character.storyId,
    character.missionId,
  ]
    .join(' ')
    .toLowerCase()
    .includes(normalized)
}

export function AdminStoryCharactersPage() {
  const navigate = useNavigate()
  const { data, error, isLoading, reload } = useAdminStoryCharacters()
  const [search, setSearch] = useState('')
  const characters = useMemo(() => data?.characters || [], [data?.characters])
  const filteredCharacters = useMemo(
    () => characters.filter((character) => matchesSearch(character, search)),
    [characters, search],
  )
  const storyCount = useMemo(
    () => new Set(characters.map((character) => character.storyId)).size,
    [characters],
  )
  const avatarCount = characters.filter((character) => character.avatarImageUrl).length

  return (
    <AdminLayout
      title="Stories"
      description="Administra los perfiles de personajes. Todas las misiones aparecen en una sola fila con su avatar."
      actions={
        <button type="button" className="btn secondary" onClick={reload} disabled={isLoading}>
          {isLoading ? 'Actualizando...' : 'Recargar stories'}
        </button>
      }
    >
      <section className="admin-video-summary-grid">
        <article className="admin-stat-card">
          <span className="eyebrow">Personajes</span>
          <strong>{characters.length}</strong>
          <p>Misiones disponibles para crear perfiles tipo Instagram.</p>
        </article>
        <article className="admin-stat-card">
          <span className="eyebrow">Stories</span>
          <strong>{storyCount}</strong>
          <p>Historias fuente de estos personajes.</p>
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
            <p className="eyebrow">Fila de stories</p>
            <h3>Personajes</h3>
          </div>

          <label className="admin-search-field">
            <span>Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre, story o mision"
            />
          </label>
        </div>

        <div className="admin-story-character-list">
          {filteredCharacters.map((character) => (
            <button
              type="button"
              key={character.characterId}
              className="admin-story-character-row"
              onClick={() => navigate(appPaths.storyCharacter(character.characterId))}
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
                <span>{character.missionTitle}</span>
                {character.sceneSummary && <small>{character.sceneSummary}</small>}
              </span>

              <span className="admin-story-character-meta">
                <span className="tag">{character.storyTitle}</span>
                <span className="tag tag-muted">Escena {character.sceneIndex + 1}</span>
              </span>
            </button>
          ))}

          {!filteredCharacters.length && (
            <div className="admin-empty-state admin-empty-state-compact">
              <strong>No hay personajes para mostrar.</strong>
              <p>Cambia la busqueda o recarga el catalogo de stories.</p>
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  )
}
