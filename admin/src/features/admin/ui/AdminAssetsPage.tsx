import { useEffect, useState } from 'react'
import { createAdminAssetUpload } from '@/features/admin/api/admin-client'
import type {
  AdminAssetFolder,
  AdminAssetUploadResponse,
} from '@/features/admin/model/types'
import { AdminLayout } from '@/features/admin/ui/AdminLayout'

const ASSET_FOLDER_OPTIONS: Array<{ value: AdminAssetFolder; label: string }> = [
  { value: 'storiesProfile', label: 'storiesProfile' },
]

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

export function AdminAssetsPage() {
  const [folder, setFolder] = useState<AdminAssetFolder>('storiesProfile')
  const [file, setFile] = useState<File>()
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>()
  const [uploadedAsset, setUploadedAsset] = useState<AdminAssetUploadResponse>()
  const [message, setMessage] = useState<string>()
  const [error, setError] = useState<string>()
  const [isUploading, setIsUploading] = useState(false)
  const [stage, setStage] = useState<string>()

  useEffect(() => {
    if (!file) {
      setLocalPreviewUrl(undefined)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(nextPreviewUrl)

    return () => {
      URL.revokeObjectURL(nextPreviewUrl)
    }
  }, [file])

  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona una foto antes de subirla.')
      return
    }

    setIsUploading(true)
    setError(undefined)
    setMessage(undefined)
    setUploadedAsset(undefined)
    setStage('Preparando URL de carga...')

    try {
      const upload = await createAdminAssetUpload(folder, file.type, file.name)
      setStage('Subiendo foto a S3...')
      const uploadResponse = await fetch(upload.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': upload.contentType,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error(`No pudimos subir la foto. HTTP ${uploadResponse.status}`)
      }

      setUploadedAsset(upload)
      setMessage('Foto subida. La URL ya esta lista para usarse.')
      setStage(undefined)
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'No pudimos subir la foto seleccionada.',
      )
      setStage(undefined)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!uploadedAsset?.url) {
      return
    }

    try {
      await navigator.clipboard.writeText(uploadedAsset.url)
      setMessage('URL copiada.')
    } catch {
      setError('No pudimos copiar la URL automaticamente.')
    }
  }

  return (
    <AdminLayout
      title="Assets"
      description="Sube fotos al bucket de assets y usa la URL publica servida por CloudFront."
    >
      {error && (
        <section className="admin-inline-alert">
          <p>{error}</p>
        </section>
      )}

      {message && (
        <section className="admin-inline-note admin-inline-note-success">
          <p>{message}</p>
        </section>
      )}

      <section className="admin-assets-grid">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Nueva imagen</p>
            <h3>Subir foto</h3>
          </div>

          <div className="admin-asset-form">
            <label className="admin-grant-field">
              <span>Carpeta</span>
              <select
                value={folder}
                onChange={(event) => setFolder(event.target.value as AdminAssetFolder)}
                disabled={isUploading}
              >
                {ASSET_FOLDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-grant-field">
              <span>Foto</span>
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0]
                  setFile(selectedFile)
                  setUploadedAsset(undefined)
                  setMessage(undefined)
                  setError(undefined)
                }}
              />
            </label>

            {file && (
              <div className="admin-session-list admin-asset-meta-list">
                <div className="admin-session-item">
                  <span>Archivo</span>
                  <strong>{file.name}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Tipo</span>
                  <strong>{file.type || 'Detectado por extension'}</strong>
                </div>
                <div className="admin-session-item">
                  <span>Tamano</span>
                  <strong>{formatBytes(file.size)}</strong>
                </div>
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
                  void handleUpload()
                }}
                disabled={isUploading || !file}
              >
                {isUploading ? 'Subiendo...' : 'Subir foto'}
              </button>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <p className="eyebrow">Resultado</p>
            <h3>URL de CloudFront</h3>
          </div>

          {localPreviewUrl ? (
            <div className="admin-asset-preview">
              <img src={localPreviewUrl} alt="Vista previa de la foto seleccionada" />
            </div>
          ) : (
            <div className="admin-empty-state admin-empty-state-compact">
              <strong>Sin foto seleccionada.</strong>
              <p>Elige un archivo para ver la vista previa antes de subirlo.</p>
            </div>
          )}

          {uploadedAsset ? (
            <div className="admin-inline-note admin-asset-result">
              <div className="admin-inline-note-detail">
                <p>
                  <strong>URL:</strong>{' '}
                  <a href={uploadedAsset.url} target="_blank" rel="noreferrer">
                    {uploadedAsset.url}
                  </a>
                </p>
                <p><strong>Key:</strong> <code>{uploadedAsset.key}</code></p>
                <p><strong>Bucket:</strong> <code>{uploadedAsset.bucketName}</code></p>
                <p>URL firmada vigente hasta {formatDateTime(uploadedAsset.expiresAt)}.</p>
              </div>

              <div className="admin-action-row">
                <button type="button" className="btn secondary" onClick={() => void handleCopyUrl()}>
                  Copiar URL
                </button>
                <a className="btn ghost" href={uploadedAsset.url} target="_blank" rel="noreferrer">
                  Abrir asset
                </a>
              </div>
            </div>
          ) : (
            <div className="admin-inline-note">
              <p>La URL final aparecera aqui cuando termine la subida.</p>
            </div>
          )}
        </article>
      </section>
    </AdminLayout>
  )
}
