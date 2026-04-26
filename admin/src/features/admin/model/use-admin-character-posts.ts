import { useEffect, useState } from 'react'
import { getAdminCharacterPosts } from '@/features/admin/api/admin-client'
import type { AdminCharacterPostsResponse } from '@/features/admin/model/types'

type AdminCharacterPostsState = {
  data?: AdminCharacterPostsResponse
  error?: string
  isLoading: boolean
}

export function useAdminCharacterPosts(characterId?: string) {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<AdminCharacterPostsState>({ isLoading: true })

  useEffect(() => {
    let cancelled = false

    if (!characterId) {
      setState({
        data: undefined,
        error: 'Selecciona un personaje valido.',
        isLoading: false,
      })
      return
    }

    setState((current) => ({
      data: current.data,
      error: undefined,
      isLoading: true,
    }))

    const loadPosts = async () => {
      try {
        const data = await getAdminCharacterPosts(characterId)
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
              : 'No pudimos cargar los posts del personaje.',
          isLoading: false,
        })
      }
    }

    void loadPosts()

    return () => {
      cancelled = true
    }
  }, [characterId, requestId])

  return {
    ...state,
    reload: () => {
      setRequestId((current) => current + 1)
    },
  }
}
