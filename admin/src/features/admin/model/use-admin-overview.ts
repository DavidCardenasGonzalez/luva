import { useEffect, useState } from 'react'
import { getAdminOverview } from '@/features/admin/api/admin-client'
import type { AdminOverview } from '@/features/admin/model/types'

type AdminOverviewState = {
  data?: AdminOverview
  error?: string
  isLoading: boolean
}

export function useAdminOverview() {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<AdminOverviewState>({ isLoading: true })

  useEffect(() => {
    let cancelled = false

    setState((current) => ({
      data: current.data,
      error: undefined,
      isLoading: true,
    }))

    const loadOverview = async () => {
      try {
        const data = await getAdminOverview()
        if (cancelled) {
          return
        }

        setState({
          data,
          error: undefined,
          isLoading: false,
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        setState({
          data: undefined,
          error:
            error instanceof Error
              ? error.message
              : 'No pudimos cargar el estado del backend administrativo.',
          isLoading: false,
        })
      }
    }

    void loadOverview()

    return () => {
      cancelled = true
    }
  }, [requestId])

  return {
    ...state,
    reload: () => {
      setRequestId((current) => current + 1)
    },
  }
}

