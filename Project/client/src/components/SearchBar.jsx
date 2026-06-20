import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import SearchIcon from '@mui/icons-material/Search'
import { searchAnime, buildAnimeSlug } from '../services/anilist.js'
import { useDebounce } from '../hooks/useDebounce.js'

/**
 * SearchBar
 * Reusable across the Navbar (compact) and homepage hero (large). Shows a
 * live dropdown preview of matching anime as the user types, and navigates
 * to /search?q=... on Enter for the full results page.
 *
 * Props:
 *  - size: 'compact' | 'large' — controls input height/font size/styling
 *  - placeholder: optional override
 *  - onNavigate: optional () => void — called right before navigating away
 *                (e.g. so the Navbar can close a mobile menu)
 */
export default function SearchBar({ size = 'compact', placeholder, onNavigate }) {
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const debouncedQuery = useDebounce(query, 350)

  // Fetch a small live preview whenever the debounced query changes
  useEffect(() => {
    let cancelled = false

    async function runSearch() {
      const trimmed = debouncedQuery.trim()
      if (trimmed.length < 2) {
        setResults([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const media = await searchAnime(trimmed, 6) // small preview list
        if (!cancelled) {
          setResults(media)
          setHighlightedIndex(-1)
        }
      } catch (err) {
        console.error('Search failed:', err.message)
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    runSearch()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  // Close the dropdown when clicking outside the component
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function goToResultsPage(searchTerm) {
    const trimmed = searchTerm.trim()
    if (!trimmed) return
    setOpen(false)
    onNavigate?.()
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  function goToAnime(anime) {
    setOpen(false)
    setQuery('')
    onNavigate?.()
    navigate(`/anime/${buildAnimeSlug(anime)}`)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        goToAnime(results[highlightedIndex])
      } else {
        goToResultsPage(query)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const isCompact = size === 'compact'

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          background: isCompact ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.06)',
          border: '1px solid',
          borderColor: open ? 'rgba(249, 168, 212, 0.45)' : 'rgba(255, 182, 215, 0.15)',
          borderRadius: isCompact ? '999px' : '18px',
          px: isCompact ? 1.6 : 2.5,
          py: isCompact ? 0.7 : 1.6,
          transition: 'border-color 0.2s ease',
          backdropFilter: 'blur(6px)',
        }}
      >
        <SearchIcon
          sx={{
            fontSize: isCompact ? '1.1rem' : '1.4rem',
            color: 'rgba(255,255,255,0.4)',
            flexShrink: 0,
          }}
        />
        <Box
          component="input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Search anime...'}
          sx={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#f1e9ff',
            fontSize: isCompact ? '0.85rem' : '1.05rem',
            fontWeight: 500,
            '&::placeholder': { color: 'rgba(255,255,255,0.35)' },
          }}
        />
        {loading && (
          <CircularProgress size={isCompact ? 14 : 18} sx={{ color: '#e879a0', flexShrink: 0 }} />
        )}
      </Box>

      {/* Live dropdown preview */}
      {open && query.trim().length >= 2 && (
        <Box
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            background: '#1a1228',
            border: '1px solid rgba(255, 182, 215, 0.15)',
            borderRadius: '14px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.55)',
            overflow: 'hidden',
            zIndex: 20,
          }}
        >
          {results.length === 0 && !loading ? (
            <Typography
              sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', px: 2, py: 2 }}
            >
              No anime found for "{query}"
            </Typography>
          ) : (
            <>
              {results.map((anime, index) => {
                const title = anime.title?.english || anime.title?.romaji || 'Untitled'
                const highlighted = index === highlightedIndex
                return (
                  <Box
                    key={anime.id}
                    onClick={() => goToAnime(anime)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.2,
                      px: 1.5,
                      py: 1,
                      cursor: 'pointer',
                      background: highlighted ? 'rgba(249, 168, 212, 0.1)' : 'transparent',
                      transition: 'background 0.12s ease',
                    }}
                  >
                    <Box
                      component="img"
                      src={anime.coverImage?.large}
                      alt={title}
                      sx={{
                        width: 32,
                        height: 46,
                        borderRadius: '6px',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: '#f1e9ff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        {anime.genres?.slice(0, 2).join(' · ') || '—'}
                      </Typography>
                    </Box>
                    {anime.averageScore != null && (
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', flexShrink: 0 }}>
                        ★ {(anime.averageScore / 10).toFixed(1)}
                      </Typography>
                    )}
                  </Box>
                )
              })}

              {/* "See all results" footer link */}
              <Box
                onClick={() => goToResultsPage(query)}
                sx={{
                  px: 1.5,
                  py: 1.1,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderTop: '1px solid rgba(255, 182, 215, 0.08)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#f9a8d4',
                  transition: 'background 0.15s ease',
                  '&:hover': { background: 'rgba(249, 168, 212, 0.06)' },
                }}
              >
                See all results for "{query}" →
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  )
}