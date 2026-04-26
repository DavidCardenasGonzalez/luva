import { useEffect, useState } from 'react'
import { getAdminStoryCharacters } from '@/features/admin/api/admin-client'
import type { AdminStoryCharactersResponse } from '@/features/admin/model/types'

type AdminStoryCharactersState = {
  data?: AdminStoryCharactersResponse
  error?: string
  isLoading: boolean
}

export function useAdminStoryCharacters() {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<AdminStoryCharactersState>({ isLoading: true })

  useEffect(() => {
    let cancelled = false

    setState((current) => ({
      data: current.data,
      error: undefined,
      isLoading: true,
    }))

    const loadCharacters = async () => {
      try {
        const data = await getAdminStoryCharacters()
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
              : 'No pudimos cargar los personajes de stories.',
          isLoading: false,
        })
      }
    }

    void loadCharacters()

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
