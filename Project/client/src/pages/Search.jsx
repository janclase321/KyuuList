import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import AnimeCard from '../components/AnimeCard.jsx'
import AnimeModal from '../components/AnimeModal.jsx'
import SearchBar from '../components/SearchBar.jsx'
import { searchAnime } from '../services/anilist.js'

export default function Search() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!query.trim()) {
        setResults([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const media = await searchAnime(query.trim(), 30)
        if (!cancelled) setResults(media)
      } catch (err) {
        console.error('Search failed:', err.message)
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [query])

  return (
    <Container sx={{ py: 4 }}>
      {/* Re-show the search bar here too, so users can refine their search
          without needing to go back to the navbar */}
      <Box sx={{ maxWidth: 480, mb: 4 }}>
        <SearchBar size="compact" placeholder="Search anime..." />
      </Box>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '1.3rem',
          color: '#f1e9ff',
          mb: 3,
        }}
      >
        {query ? (
          <>
            Results for <span style={{ color: '#f9a8d4' }}>"{query}"</span>
          </>
        ) : (
          'Search for an anime'
        )}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#e879a0' }} />
        </Box>
      ) : !query.trim() ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
          Type something into the search bar above to find anime.
        </Typography>
      ) : results.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
          No anime found for "{query}". Try a different title or spelling.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)',
            },
            gap: 2,
          }}
        >
          {results.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} onSelect={setSelected} />
          ))}
        </Box>
      )}

      <AnimeModal
        anime={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </Container>
  )
}