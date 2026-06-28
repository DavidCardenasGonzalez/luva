import { useEffect, useState, type CSSProperties } from 'react'
import {
  getAdminCharacterBiography,
  saveAdminCharacterBiography,
} from '@/features/admin/api/admin-client'

type Props = {
  characterId: string
}

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 180,
  padding: '12px 14px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  lineHeight: 1.5,
  boxSizing: 'border-box',
  resize: 'vertical',
}

// Editor for a character's long-term biography. This is the admin-managed memory
// source (distinct from the short `characterBio` tagline): on save it is
// persisted and embedded into Pinecone so the character can use it as factual
// background in every conversation.
export function CharacterBiographyPanel({ characterId }: Props) {
  const [biography, setBiography] = useState('')
  const [savedBiography, setSavedBiography] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [message, setMessage] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(undefined)
    getAdminCharacterBiography(characterId)
      .then((res) => {
        if (cancelled) return
        setBiography(res.biography || '')
        setSavedBiography(res.biography || '')
        setUpdatedAt(res.updatedAt)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'No pudimos cargar la biografía.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [characterId])

  const isDirty = biography !== savedBiography

  async function handleSave() {
    setIsSaving(true)
    setError(undefined)
    setMessage(undefined)
    try {
      const res = await saveAdminCharacterBiography(characterId, biography)
      setBiography(res.biography || '')
      setSavedBiography(res.biography || '')
      setUpdatedAt(res.updatedAt)
      setMessage('Biografía guardada y memoria actualizada.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar la biografía.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="admin-panel" style={{ marginBottom: 16 }}>
      <div className="admin-panel-head">
        <p className="eyebrow">Memoria de largo plazo</p>
        <h3>Biografía del personaje</h3>
      </div>
      <p style={{ marginTop: 0, color: '#64748b', fontSize: 13 }}>
        Esta biografía se inyecta como contexto factual en cada conversación. Al guardar, se
        genera un embedding y se almacena en Pinecone (un único documento por personaje). Es
        distinta de la <code>characterBio</code> corta del catálogo.
      </p>

      <textarea
        value={biography}
        onChange={(event) => setBiography(event.target.value)}
        placeholder={
          isLoading
            ? 'Cargando biografía...'
            : 'Escribe la biografía de largo plazo del personaje (historia, contexto, rasgos duraderos)...'
        }
        style={textareaStyle}
        disabled={isLoading || isSaving}
      />

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="btn primary"
          onClick={() => void handleSave()}
          disabled={isLoading || isSaving || !isDirty}
        >
          {isSaving ? 'Guardando...' : 'Guardar biografía'}
        </button>
        {updatedAt && (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>
            Última actualización: {new Date(updatedAt).toLocaleString('es-MX')}
          </span>
        )}
        {isDirty && !isSaving && (
          <span style={{ fontSize: 12, color: '#b45309' }}>Cambios sin guardar</span>
        )}
      </div>

      {error && (
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
          {error}
        </p>
      )}
      {message && !error && (
        <p
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: '#ecfdf5',
            color: '#065f46',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {message}
        </p>
      )}
    </section>
  )
}
