import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CircularProgress from '@mui/material/CircularProgress'
import AnimeCard from '../components/AnimeCard.jsx'
import AnimeModal from '../components/AnimeModal.jsx'
import { usePaginatedAnime } from '../services/usePaginatedAnime.js'
import {
  getTopRatedAnime,
  getAiringAnime,
  getUpcomingAnime,
} from '../services/anilist.js'

// Friendly label like "Fall 2026" from AniList's season enum
function formatSeasonLabel(season, seasonYear) {
  if (!season || !seasonYear) return ''
  const label = season.charAt(0) + season.slice(1).toLowerCase()
  return `${label} ${seasonYear}`
}

// Maps the :type route param to everything that section needs: which
// fetch function to call, the base title, whether rank badges show, and
// the empty-state message. Centralizing this here means adding a future
// carousel (e.g. "Trending") only needs one new entry, not a new page.
const CATEGORY_CONFIG = {
  'top-rated': {
    title: 'Top Rated Anime',
    fetchPage: getTopRatedAnime,
    showRank: true,
    emptyMessage: 'No top rated anime found.',
    useSeasonLabel: false,
  },
  airing: {
    title: 'Airing Now',
    fetchPage: getAiringAnime,
    showRank: false,
    emptyMessage: 'Nothing airing right now — check back when the season starts!',
    useSeasonLabel: true,
  },
  upcoming: {
    title: 'Upcoming',
    fetchPage: getUpcomingAnime,
    showRank: false,
    emptyMessage: 'No upcoming anime announced yet for next season — check back soon!',
    useSeasonLabel: true,
  },
}

export default function CategoryResults() {
  const { type } = useParams()
  const config = CATEGORY_CONFIG[type]

  const { animeList, loading, loadingMore, handleNearEnd } = usePaginatedAnime(
    config?.fetchPage ?? (async () => ({ media: [], hasNextPage: false })),
    24 // larger page size than the homepage carousels, since this is a
       // dedicated browsing page rather than a small preview row
  )

  const [seasonLabel, setSeasonLabel] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (config?.useSeasonLabel && animeList.length > 0) {
      const first = animeList[0]
      if (first.season && first.seasonYear) {
        setSeasonLabel(formatSeasonLabel(first.season, first.seasonYear))
      }
    }
  }, [animeList, config])

  if (!config) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1e9ff', mb: 1 }}>
          🌸 Category not found
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
          That browsing category doesn't exist.
        </Typography>
      </Container>
    )
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Back + title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton
          component={Link}
          to="/"
          aria-label="Back to home"
          sx={{
            color: 'rgba(255,255,255,0.6)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255, 182, 215, 0.15)',
            '&:hover': { color: '#f9a8d4', background: 'rgba(249, 168, 212, 0.1)' },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>

        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: '#f1e9ff' }}
        >
          {config.title}{seasonLabel ? ` — ${seasonLabel}` : ''}
        </Typography>
      </Box>

      {/* Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#e879a0' }} />
        </Box>
      ) : animeList.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
          {config.emptyMessage}
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
            {animeList.map((anime, index) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onSelect={setSelected}
                rank={config.showRank ? index + 1 : undefined}
              />
            ))}
          </Box>

          {/* Simple "load more" trigger for this grid layout — the
              scroll-near-end pattern from the carousel doesn't map
              cleanly to a vertical grid, so a button is more predictable */}
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