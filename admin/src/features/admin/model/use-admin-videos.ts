import { useEffect, useState } from 'react'
import { getAdminVideos } from '@/features/admin/api/admin-client'
import type { AdminVideosResponse } from '@/features/admin/model/types'

type AdminVideosState = {
  data?: AdminVideosResponse
  error?: string
  isLoading: boolean
}

export function useAdminVideos() {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<AdminVideosState>({ isLoading: true })

  useEffect(() => {
    let cancelled = false

    setState((current) => ({
      data: current.data,
      error: undefined,
      isLoading: true,
    }))

    const loadVideos = async () => {
      try {
        const data = await getAdminVideos()
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
              : 'No pudimos cargar el tablero de videos.',
          isLoading: false,
        })
      }
    }

    void loadVideos()

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
