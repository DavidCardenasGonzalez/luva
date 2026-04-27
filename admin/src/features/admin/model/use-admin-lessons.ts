import { useEffect, useState } from 'react'
import { getAdminLessons } from '@/features/admin/api/admin-client'
import type { AdminLessonsResponse } from '@/features/admin/model/types'

type AdminLessonsState = {
  data?: AdminLessonsResponse
  error?: string
  isLoading: boolean
}

export function useAdminLessons() {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<AdminLessonsState>({ isLoading: true })

  useEffect(() => {
    let cancelled = false

    setState((current) => ({ data: current.data, error: undefined, isLoading: true }))

    const load = async () => {
      try {
        const data = await getAdminLessons()
        if (cancelled) return
        setState({ data, error: undefined, isLoading: false })
      } catch (error) {
        if (cancelled) return
        setState({
          data: undefined,
          error: error instanceof Error ? error.message : 'No pudimos cargar las lecciones.',
          isLoading: false,
        })
      }
    }

    void load()
    return () => { cancelled = true }
  }, [requestId])

  return {
    ...state,
    reload: () => setRequestId((n) => n + 1),
  }
}
