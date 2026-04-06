import { Link } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import {
  deleteAccountRetentionNote,
  lastLegalUpdate,
  supportEmail,
} from '@/features/marketing/content/site-content'
import { luvaLogo } from '@/shared/assets/brand'

const deletionSteps = [
  'Envía un correo a dcardenasgz@gmail.com con el asunto "Eliminar cuenta Luva".',
  'Incluye el correo con el que te registraste en Luva o cualquier dato que nos permita identificar tu cuenta.',
  'Si existe una suscripción activa, cancélala primero desde Google Play o App Store para evitar renovaciones posteriores.',
  'Procesaremos la solicitud y te confirmaremos por correo cuando la cuenta y los datos asociados hayan sido eliminados.',
]

const deletedData = [
  'Datos de perfil de Luva, como correo, alias y los identificadores asociados a tu cuenta.',
  'Progreso de aprendizaje, historial de sesiones, métricas y configuraciones vinculadas a tu usuario.',
  'Transcripciones y registros de uso asociados a tu cuenta dentro de Luva.',
]

const retainedData = [
  deleteAccountRetentionNote,
  'La información ya anonimizada o agregada, que no permita identificarte directamente, puede mantenerse para análisis internos del servicio.',
]

export function DeleteAccountPage() {
  return (
    <div className="page page-delete-account">
      <main className="delete-account-shell">
        <section className="delete-account-card">
          <div className="delete-account-header">
            <Link className="brand brand-logo" to={appPaths.home} aria-label="Luva home">
              <img src={luvaLogo} alt="Luva" />
            </Link>
            <span className="pill">Google Play - eliminación de cuenta</span>
          </div>

          <div className="delete-account-hero">
            <p className="eyebrow">Luva</p>
            <h1>Solicitud de eliminación de cuenta y datos asociados</h1>
            <p className="lede">
              Esta página corresponde a la app <strong>Luva</strong> y explica cómo solicitar la eliminación de tu
              cuenta desde una URL pública propia, tal como lo pide Google Play.
            </p>
          </div>

          <div className="delete-account-grid">
            <section className="delete-account-section">
              <h2>Cómo solicitar la eliminación</h2>
              <ol className="delete-account-list numbered">
                {deletionSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="policy-note">
                <strong>Correo de solicitud:</strong> <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              </div>
            </section>

            <section className="delete-account-section">
              <h2>Datos que se eliminarán</h2>
              <ul className="delete-account-list">
                {deletedData.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="delete-account-section">
              <h2>Datos que pueden conservarse temporalmente</h2>
              <ul className="delete-account-list">
                {retainedData.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="delete-account-footer">
            <p className="muted">Última actualización: {lastLegalUpdate}</p>
            <div className="footer-links">
              <Link to={appPaths.home}>Inicio</Link>
              <Link to={appPaths.links}>Links</Link>
            </div>
          </footer>
        </section>
      </main>
    </div>
  )
}
