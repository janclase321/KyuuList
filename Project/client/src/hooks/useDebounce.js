import { useEffect, useState } from 'react'

/**
 * useDebounce
 * Returns a value that only updates after `delay` ms have passed without
 * the input changing again. Used to avoid firing an AniList request on
 * every single keystroke while someone's typing in the search bar.
 */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}