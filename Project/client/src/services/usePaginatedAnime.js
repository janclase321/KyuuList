import { useEffect, useRef, useState } from 'react'

/**
 * usePaginatedAnime
 * Shared fetch + pagination logic for any homepage carousel backed by an
 * AniList query that returns { media, hasNextPage }.
 *
 * fetchPage: (page, perPage) => Promise<{ media, hasNextPage }>
 * perPage: items per page/request
 */
export function usePaginatedAnime(fetchPage, perPage = 8) {
  const [animeList, setAnimeList] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const page = useRef(1)
  const hasNextPage = useRef(true)
  const isFetching = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const { media, hasNextPage: next } = await fetchPage(1, perPage)
        if (!cancelled) {
          // Defensive dedupe in case the first page itself contains
          // internal duplicates from the API.
          const seenIds = new Set()
          const unique = media.filter((a) => {
            if (seenIds.has(a.id)) return false
            seenIds.add(a.id)
            return true
          })
          setAnimeList(unique)
          hasNextPage.current = next
          page.current = 1
        }
      } catch (err) {
        console.error('Failed to load anime:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // fetchPage is expected to be stable (defined outside render or memoized)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleNearEnd() {
    if (isFetching.current || !hasNextPage.current) return

    isFetching.current = true
    setLoadingMore(true)

    try {
      const nextPage = page.current + 1
      const { media, hasNextPage: next } = await fetchPage(nextPage, perPage)
      setAnimeList((prev) => {
        // AniList can return the same anime across consecutive pages when
        // many entries tie on the sort field (e.g. SCORE_DESC ties) — dedupe
        // by id so React never sees two cards with the same key.
        const seenIds = new Set(prev.map((a) => a.id))
        const newUnique = media.filter((a) => !seenIds.has(a.id))
        return [...prev, ...newUnique]
      })
      page.current = nextPage
      hasNextPage.current = next
    } catch (err) {
      console.error('Failed to load more anime:', err)
    } finally {
      setLoadingMore(false)
      isFetching.current = false
    }
  }

  return { animeList, loading, loadingMore, handleNearEnd }
}