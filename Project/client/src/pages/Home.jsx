import { useEffect, useState } from 'react'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import HeroSlideshow from '../components/HeroSlideshow.jsx'
import AnimeCarousel from '../components/AnimeCarousel.jsx'
import AnimeModal from '../components/AnimeModal.jsx'
import { usePaginatedAnime } from '../services/usePaginatedAnime.js'
import {
  getTopRatedAnime,
  getTrendingAnime,
  getAiringAnime,
  getUpcomingAnime,
} from '../services/anilist.js'

// Friendly label like "Fall 2026" from AniList's season enum
function formatSeasonLabel(season, seasonYear) {
  if (!season || !seasonYear) return ''
  const label = season.charAt(0) + season.slice(1).toLowerCase()
  return `${label} ${seasonYear}`
}

function CarouselSkeleton() {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            flex: '0 0 170px',
            aspectRatio: '2 / 3',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.04)',
          }}
        />
      ))}
    </Box>
  )
}

export default function Home() {
  // Top rated carousel — uses the shared pagination hook
  const topRated = usePaginatedAnime(getTopRatedAnime, 8)

  // Airing-this-season carousel — same hook, different query
  const airing = usePaginatedAnime(getAiringAnime, 8)
  const [airingSeasonLabel, setAiringSeasonLabel] = useState('')

  // Upcoming season carousel — same hook, different query
  const upcoming = usePaginatedAnime(getUpcomingAnime, 8)
  const [seasonLabel, setSeasonLabel] = useState('')

  // Trending hero — separate shape (no pagination), fetched directly
  const [trendingList, setTrendingList] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)

  // Shared modal state — any section can open it
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadTrending() {
      try {
        setTrendingLoading(true)
        const media = await getTrendingAnime(5)
        if (!cancelled) setTrendingList(media)
      } catch (err) {
        console.error('Failed to load trending anime:', err)
      } finally {
        if (!cancelled) setTrendingLoading(false)
      }
    }

    loadTrending()
    return () => {
      cancelled = true
    }
  }, [])

  // Grab the season/year label once the first page of airing anime loads
  useEffect(() => {
    if (airing.animeList.length > 0) {
      const first = airing.animeList[0]
      if (first.season && first.seasonYear) {
        setAiringSeasonLabel(formatSeasonLabel(first.season, first.seasonYear))
      }
    }
  }, [airing.animeList])

  // Grab the season/year label once the first page of upcoming anime loads
  useEffect(() => {
    if (upcoming.animeList.length > 0) {
      const first = upcoming.animeList[0]
      if (first.season && first.seasonYear) {
        setSeasonLabel(formatSeasonLabel(first.season, first.seasonYear))
      }
    }
  }, [upcoming.animeList])

  return (
    <Container sx={{ py: 4 }}>
      {/* Hero: trending anime slideshow */}
      <Box sx={{ mb: 5 }}>
        <HeroSlideshow
          animeList={trendingList}
          onSelect={setSelected}
          loading={trendingLoading}
        />
      </Box>

      {/* Top rated carousel */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: '#f1e9ff',
          mb: 3,
        }}
      >
        Top Rated Anime
      </Typography>

      {topRated.loading ? (
        <CarouselSkeleton />
      ) : (
        <AnimeCarousel
          animeList={topRated.animeList}
          onSelect={setSelected}
          onNearEnd={topRated.handleNearEnd}
          loadingMore={topRated.loadingMore}
          showRank
        />
      )}

      {/* Airing this season carousel */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: '#f1e9ff',
          mt: 5,
          mb: 3,
        }}
      >
        Airing Now{airingSeasonLabel ? ` — ${airingSeasonLabel}` : ''}
      </Typography>

      {airing.loading ? (
        <CarouselSkeleton />
      ) : airing.animeList.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
          Nothing airing right now — check back when the season starts!
        </Typography>
      ) : (
        <AnimeCarousel
          animeList={airing.animeList}
          onSelect={setSelected}
          onNearEnd={airing.handleNearEnd}
          loadingMore={airing.loadingMore}
        />
      )}

      {/* Upcoming season carousel */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: '#f1e9ff',
          mt: 5,
          mb: 3,
        }}
      >
        Upcoming{seasonLabel ? ` — ${seasonLabel}` : ''}
      </Typography>

      {upcoming.loading ? (
        <CarouselSkeleton />
      ) : upcoming.animeList.length === 0 ? (
        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem' }}>
          No upcoming anime announced yet for next season — check back soon!
        </Typography>
      ) : (
        <AnimeCarousel
          animeList={upcoming.animeList}
          onSelect={setSelected}
          onNearEnd={upcoming.handleNearEnd}
          loadingMore={upcoming.loadingMore}
        />
      )}

      <AnimeModal
        anime={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </Container>
  )
}