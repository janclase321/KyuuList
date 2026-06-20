import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { getAnimeById, parseAnimeIdFromSlug } from '../services/anilist.js'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getWatchlistEntry,
  upsertWatchlistEntry,
  WATCH_STATUS,
} from '../services/watchlist.js'

function StatPill({ label }) {
  return (
    <Box
      sx={{
        px: 1.4,
        py: 0.6,
        borderRadius: '999px',
        fontSize: '0.78rem',
        fontWeight: 700,
        color: '#f9d4e4',
        background: 'rgba(232, 121, 160, 0.12)',
        border: '1px solid rgba(232, 121, 160, 0.25)',
      }}
    >
      {label}
    </Box>
  )
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function formatStatus(status) {
  const map = {
    RELEASING: 'Airing',
    FINISHED: 'Completed',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
    HIATUS: 'On hiatus',
  }
  return map[status] || capitalize(status)
}

export default function Anime() {
  const { slug } = useParams()
  const { user } = useAuth()

  const [anime, setAnime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [watchStatus, setWatchStatus] = useState(null) // current status or null
  const [savingStatus, setSavingStatus] = useState(false)

  // Load the anime itself from AniList, resolved via the slug's id suffix
  useEffect(() => {
    let cancelled = false

    async function load() {
      const animeId = parseAnimeIdFromSlug(slug)
      if (!animeId) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getAnimeById(animeId)
        if (!cancelled) {
          if (!data) {
            setNotFound(true)
          } else {
            setAnime(data)
          }
        }
      } catch (err) {
        console.error('Failed to load anime:', err)
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  // Once we know who's logged in + which anime this is, check their
  // existing watchlist status for it
  useEffect(() => {
    let cancelled = false

    async function loadStatus() {
      if (!user || !anime) return
      const entry = await getWatchlistEntry(user.id, anime.id)
      if (!cancelled) setWatchStatus(entry?.status ?? null)
    }

    loadStatus()
    return () => {
      cancelled = true
    }
  }, [user, anime])

  async function handleSetStatus(status) {
    if (!user || !anime) return
    setSavingStatus(true)
    try {
      await upsertWatchlistEntry(user.id, anime.id, status)
      setWatchStatus(status)
    } catch (err) {
      console.error('Failed to update watchlist:', err.message)
    } finally {
      setSavingStatus(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: '#e879a0' }} />
      </Box>
    )
  }

  if (notFound || !anime) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1e9ff', mb: 1 }}>
          🌸 Anime not found
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
          We couldn't find that title. It may have been mistyped or removed.
        </Typography>
        <Button
          component={Link}
          to="/"
          sx={{
            color: '#f9a8d4',
            fontWeight: 700,
            textTransform: 'none',
          }}
        >
          ← Back to home
        </Button>
      </Container>
    )
  }

  const title = anime.title?.english || anime.title?.romaji || 'Untitled'
  const altTitle =
    anime.title?.english && anime.title?.romaji && anime.title.english !== anime.title.romaji
      ? anime.title.romaji
      : null
  const score = anime.averageScore
  const studio = anime.studios?.nodes?.[0]?.name
  const banner = anime.bannerImage || anime.coverImage?.large
  const description = anime.description
    ? anime.description.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?i>/gi, '')
    : 'No synopsis available.'

  return (
    <Box>
      {/* Banner */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: { xs: 220, sm: 320, md: 380 },
          background: banner
            ? `linear-gradient(180deg, rgba(18,13,30,0.2) 0%, #120d1e 100%), url(${banner})`
            : 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <Container sx={{ pb: 6 }}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' }, mt: { xs: -8, sm: -10 } }}>
          {/* Cover */}
          <Box
            component="img"
            src={anime.coverImage?.large}
            alt={title}
            sx={{
              width: { xs: 140, sm: 180 },
              height: { xs: 198, sm: 254 },
              borderRadius: '16px',
              objectFit: 'cover',
              border: '4px solid #120d1e',
              boxShadow: '0 10px 28px rgba(0,0,0,0.5)',
              flexShrink: 0,
            }}
          />

          {/* Title + actions */}
          <Box sx={{ pt: { xs: 0, sm: 9 }, minWidth: 0, flex: 1 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.3rem', sm: '1.7rem' },
                color: '#f1e9ff',
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
            {altTitle && (
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', mt: 0.3 }}>
                {altTitle}
              </Typography>
            )}

            {/* Watchlist status buttons */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              {user ? (
                Object.values(WATCH_STATUS).map((status) => {
                  const active = watchStatus === status
                  return (
                    <Button
                      key={status}
                      onClick={() => handleSetStatus(status)}
                      disabled={savingStatus}
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        px: 1.8,
                        borderRadius: '20px',
                        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                        background: active
                          ? 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)'
                          : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor: active ? 'transparent' : 'rgba(255, 182, 215, 0.18)',
                        '&:hover': {
                          background: active
                            ? 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)'
                            : 'rgba(249, 168, 212, 0.1)',
                        },
                      }}
                    >
                      {capitalize(status)}
                    </Button>
                  )
                })
              ) : (
                <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                  Log in to add this to your watchlist.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Stats */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mt: 4 }}>
          {score != null && <StatPill label={`⭐ ${(score / 10).toFixed(1)}`} />}
          {anime.episodes && <StatPill label={`${anime.episodes} eps`} />}
          {anime.status && <StatPill label={formatStatus(anime.status)} />}
          {anime.season && anime.seasonYear && (
            <StatPill label={`${capitalize(anime.season)} ${anime.seasonYear}`} />
          )}
          {studio && <StatPill label={studio} />}
        </Box>

        {/* Genres */}
        {anime.genres?.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 2.5 }}>
            {anime.genres.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                size="small"
                sx={{
                  background: 'rgba(167, 139, 250, 0.15)',
                  color: '#d8c9ff',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  border: '1px solid rgba(167, 139, 250, 0.25)',
                }}
              />
            ))}
          </Box>
        )}

        {/* Synopsis */}
        <Typography
          sx={{
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            mt: 4,
            mb: 1,
          }}
        >
          Synopsis
        </Typography>
        <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }}>
          {description}
        </Typography>
      </Container>
    </Box>
  )
}