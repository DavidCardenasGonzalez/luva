import type { CardProgressStatus } from '@/features/progress/api/progress-client'
import { CARD_STATUS_LABELS, STATUS_ORDER } from '@/features/vocabulary/lib/card-progress'

type CardStatusSwitchProps = {
  value: CardProgressStatus
  onChange: (status: CardProgressStatus) => void
  allowedStatuses?: CardProgressStatus[]
  disabled?: boolean
  pendingStatus?: CardProgressStatus | null
}

export function CardStatusSwitch({
  value,
  onChange,
  allowedStatuses = STATUS_ORDER,
  disabled = false,
  pendingStatus = null,
}: CardStatusSwitchProps) {
  return (
    <div className="card-status-switch" role="group" aria-label="Estado de la card">
      {allowedStatuses.map((status) => (
        <button
          key={status}
          type="button"
          className={`card-status-switch-button card-status-switch-button-${status}${
            value === status ? ' is-active' : ''
          }`}
          onClick={() => {
            if (status !== value) {
              onChange(status)
            }
          }}
          disabled={disabled}
        >
          {pendingStatus === status ? 'Guardando…' : CARD_STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  )
}
