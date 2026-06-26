import { useCallback, useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import AnimeCard from '../components/AnimeCard.jsx'
import AnimeModal from '../components/AnimeModal.jsx'
import { usePaginatedAnime } from '../services/usePaginatedAnime.js'
import { getBrowseAnime, ANILIST_GENRES, BROWSE_SORT_OPTIONS } from '../services/anilist.js'

export default function Anime() {
  const [activeGenre, setActiveGenre] = useState(null) // null = no filter
  const [sortKey, setSortKey] = useState('popularity')
  const [selected, setSelected] = useState(null)

  // useCallback keeps this function's identity stable UNLESS genre/sortKey
  // actually change — that's what tells usePaginatedAnime to refetch from
  // page 1 when the user picks a new filter, instead of refetching on
  // every render.
  const fetchPage = useCallback(
    (page, perPage) => getBrowseAnime({ genre: activeGenre, sortKey, page, perPage }),
    [activeGenre, sortKey]
  )

  const { animeList, loading, loadingMore, handleNearEnd } = usePaginatedAnime(fetchPage, 24)

  return (
    <Container sx={{ py: 4 }}>
      <Typography
        variant="h5"
        sx={{ fontWeight: 800, color: '#f1e9ff', mb: 3 }}
      >
        Browse Anime
      </Typography>

      {/* Controls: genre chips + sort dropdown */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        {/* Genre chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
          <GenreChip
            label="All"
            active={activeGenre === null}
            onClick={() => setActiveGenre(null)}
          />
          {ANILIST_GENRES.map((genre) => (
            <GenreChip
              key={genre}
              label={genre}
              active={activeGenre === genre}
              onClick={() => setActiveGenre(genre)}
            />
          ))}
        </Box>

        {/* Sort dropdown — plain native <select>/<option>, not Box-wrapped,
            since MUI's Box component="option" passthrough for native form
            elements isn't something to rely on without testing in a real
            browser; sx is applied here via the Box wrapper one level up
            instead, with raw inline styles on the select itself. */}
        <Box
          sx={{
            flexShrink: 0,
            alignSelf: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: '#f1e9ff',
              border: '1px solid rgba(255, 182, 215, 0.18)',
              borderRadius: '999px',
              padding: '7px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {Object.entries(BROWSE_SORT_OPTIONS).map(([key, { label }]) => (
              <option key={key} value={key} style={{ background: '#1a1228' }}>
                {label}
              </option>
            ))}
          </select>
        </Box>
      </Box>

      {/* Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#e879a0' }} />
        </Box>
      ) : animeList.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
          No anime found for this filter.
        </Typography>
      ) : (
        <>
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
            {animeList.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} onSelect={setSelected} />
            ))}
          </Box>

          {loadingMore ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} sx={{ color: '#e879a0' }} />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Box
                component="button"
                onClick={handleNearEnd}
                sx={{
                  border: '1px solid rgba(255, 182, 215, 0.2)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.7)',
                  borderRadius: '999px',
                  px: 3,
                  py: 1,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  '&:hover': {
                    background: 'rgba(249, 168, 212, 0.1)',
                    color: '#f9a8d4',
                  },
                }}
              >
                Load More
              </Box>
            </Box>
          )}
        </>
      )}

      <AnimeModal
        anime={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </Container>
  )
}

function GenreChip({ label, active, onClick }) {
  return (
    <Box
      onClick={onClick}
      role="button"
      sx={{
        px: 1.5,
        py: 0.5,
        borderRadius: '999px',
        fontSize: '0.78rem',
        fontWeight: 700,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: active ? 'rgba(249,168,212,0.45)' : 'rgba(255,255,255,0.12)',
        color: active ? '#f9a8d4' : 'rgba(255,255,255,0.55)',
        background: active ? 'rgba(249,168,212,0.1)' : 'transparent',
        transition: 'all 0.15s ease',
        '&:hover': { borderColor: 'rgba(249,168,212,0.35)', color: '#f9a8d4' },
      }}
    >
      {label}
    </Box>
  )
}