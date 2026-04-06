import { useEffect, useState } from 'react'
import { getAdminUsers } from '@/features/admin/api/admin-client'
import type { AdminUsersResponse } from '@/features/admin/model/types'

type AdminUsersState = {
  data?: AdminUsersResponse
  error?: string
  isLoading: boolean
}

export function useAdminUsers(search?: string) {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<AdminUsersState>({ isLoading: true })

  useEffect(() => {
    let cancelled = false

    setState((current) => ({
      data: current.data,
      error: undefined,
      isLoading: true,
    }))

    const loadUsers = async () => {
      try {
        const data = await getAdminUsers(search)
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
              : 'No pudimos cargar el listado de usuarios.',
          isLoading: false,
        })
      }
    }

    void loadUsers()

    return () => {
      cancelled = true
    }
  }, [requestId, search])

  return {
    ...state,
    reload: () => {
      setRequestId((current) => current + 1)
    },
  }
}

