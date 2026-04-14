import { useEffect, useState } from 'react'
import { getAdminFeedPosts } from '@/features/admin/api/admin-client'
import type { AdminFeedPostsResponse } from '@/features/admin/model/types'

type AdminFeedPostsState = {
  data?: AdminFeedPostsResponse
  error?: string
  isLoading: boolean
}

export function useAdminFeedPosts() {
  const [requestId, setRequestId] = useState(0)
  const [state, setState] = useState<AdminFeedPostsState>({ isLoading: true })

  useEffect(() => {
    let cancelled = false

    setState((current) => ({
      data: current.data,
      error: undefined,
      isLoading: true,
    }))

    const loadPosts = async () => {
      try {
        const data = await getAdminFeedPosts()
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
              : 'No pudimos cargar los posts del feed.',
          isLoading: false,
        })
      }
    }

    void loadPosts()

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
