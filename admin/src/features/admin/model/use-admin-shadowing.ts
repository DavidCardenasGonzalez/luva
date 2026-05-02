import { useEffect, useState } from 'react'
import { getAdminShadowing } from '@/features/admin/api/admin-client'
import type { AdminShadowingResponse } from '@/features/admin/model/types'

type AdminShadowingState = {
  data?: AdminShadowingResponse
  error?: string
  isLoading: boolean
}

export function useAdminShadowing() {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<AdminShadowingState>({ isLoading: true })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setState((current) => ({ data: current.data, error: undefined, isLoading: true }))

      try {
        const data = await getAdminShadowing()
        if (cancelled) return
        setState({ data, error: undefined, isLoading: false })
      } catch (error) {
        if (cancelled) return
        setState({
          data: undefined,
          error: error instanceof Error ? error.message : 'No pudimos cargar Shadowing.',
          isLoading: false,
        })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [requestId])

  return {
    ...state,
    reload: () => setRequestId((current) => current + 1),
  }
}
