import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import Fade from '@mui/material/Fade'
import { buildAnimeSlug } from '../services/anilist.js'
import { useAuth } from '../context/AuthContext.jsx'
import { getWatchlistEntry, upsertWatchlistEntry, WATCH_STATUS } from '../services/watchlist.js'

/**
 * AnimeModal
 * Full-detail view for an anime, opened from AnimeCard.
 *
 * Props:
 *  - anime: AniList media object, or null when closed
 *  - open: boolean
 *  - onClose: () => void
 */
export default function AnimeModal({ anime, open, onClose }) {
  const { user } = useAuth()
  const [onWatchlist, setOnWatchlist] = useState(false)
  const [savingWatchlist, setSavingWatchlist] = useState(false)

  // Check whether this anime is already on the user's watchlist whenever
  // the modal opens for a (possibly new) anime
  useEffect(() => {
    let cancelled = false

    async function checkWatchlist() {
      if (!user || !anime) {
        setOnWatchlist(false)
        return
      }
      const entry = await getWatchlistEntry(user.id, anime.id)
      if (!cancelled) setOnWatchlist(Boolean(entry))
    }

    checkWatchlist()
    return () => {
      cancelled = true
    }
  }, [user, anime])

  if (!anime) return null

  async function handleAddToWatchlist() {
    if (!user) return
    setSavingWatchlist(true)
    try {
      await upsertWatchlistEntry(user.id, anime.id, WATCH_STATUS.PLAN_TO_WATCH)
      setOnWatchlist(true)
    } catch (err) {
      console.error('Failed to add to watchlist:', err.message)
    } finally {
      setSavingWatchlist(false)
    }
  }

  const slug = buildAnimeSlug(anime)

  const title = anime.title?.english || anime.title?.romaji || 'Untitled'
  const altTitle =
    anime.title?.english && anime.title?.romaji && anime.title.english !== anime.title.romaji
      ? anime.title.romaji
      : null
  const score = anime.averageScore
  const studio = anime.studios?.nodes?.[0]?.name
  const banner = anime.bannerImage || anime.coverImage?.large

  // AniList descriptions can contain <br> and <i> tags — strip them to plain text
  const description = anime.description
    ? anime.description.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?i>/gi, '')
    : 'No synopsis available.'

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: 640,
            maxHeight: '88vh',
            overflowY: 'auto',
            borderRadius: '20px',
            background: '#1a1228',
            border: '1px solid rgba(255, 182, 215, 0.15)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            outline: 'none',
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(232, 121, 160, 0.3)',
              borderRadius: 8,
            },
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={onClose}
            aria-label="Close"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 2,
              color: '#fff',
              background: 'rgba(18, 13, 30, 0.55)',
              backdropFilter: 'blur(6px)',
              '&:hover': {
                background: 'rgba(232, 121, 160, 0.35)',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Banner */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 180,
              background: banner
                ? `linear-gradient(180deg, rgba(18,13,30,0.1) 0%, #1a1228 100%), url(${banner})`
                : 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          <Box sx={{ display: 'flex', gap: 2.5, px: 3, mt: -7 }}>
            {/* Cover thumbnail */}
            <Box
              component="img"
              src={anime.coverImage?.large}
              alt={title}
              sx={{
                width: 110,
                height: 156,
                borderRadius: '12px',
                objectFit: 'cover',
                border: '3px solid #1a1228',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                flexShrink: 0,
              }}
            />

            {/* Title block */}
            <Box sx={{ pt: 7.5, minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.15rem',
                  color: '#f1e9ff',
                  lineHeight: 1.2,
                }}
              >
                {title}
              </Typography>
              {altTitle && (
                <Typography
                  sx={{
                    fontSize: '0.78rem',
                    color: 'rgba(255,255,255,0.45)',
                    mt: 0.3,
                  }}
                >
                  {altTitle}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Body */}
          <Box sx={{ px: 3, pt: 2, pb: 3 }}>
            {/* Stat row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 2.5 }}>
              {score != null && (
                <StatPill label={`⭐ ${(score / 10).toFixed(1)}`} />
              )}
              {anime.episodes && <StatPill label={`${anime.episodes} eps`} />}
              {anime.status && <StatPill label={formatStatus(anime.status)} />}
              {anime.season && anime.seasonYear && (
                <StatPill label={`${capitalize(anime.season)} ${anime.seasonYear}`} />
              )}
              {studio && <StatPill label={studio} />}
            </Box>

            {/* Actions: view full details + add to watchlist */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 2.5 }}>
              <Button
                component={Link}
                to={`/anime/${slug}`}
                onClick={onClose}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  px: 2.5,
                  py: 0.9,
                  borderRadius: '20px',
                  boxShadow: '0 0 14px rgba(232, 121, 160, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
                    boxShadow: '0 0 22px rgba(232, 121, 160, 0.55)',
                  },
                }}
              >
                View Full Details
              </Button>

              {user && (
                <Button
                  onClick={handleAddToWatchlist}
                  disabled={onWatchlist || savingWatchlist}
                  startIcon={
                    onWatchlist ? (
                      <BookmarkAddedIcon fontSize="small" />
                    ) : (
                      <BookmarkAddOutlinedIcon fontSize="small" />
                    )
                  }
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textTransform: 'none',
                    px: 2.2,
                    py: 0.9,
                    borderRadius: '20px',
                    color: onWatchlist ? '#c4b5fd' : 'rgba(255,255,255,0.75)',
                    background: onWatchlist
                      ? 'rgba(167, 139, 250, 0.12)'
                      : 'rgba(255,255,255,0.05)',
                    border: '1px solid',
                    borderColor: onWatchlist
                      ? 'rgba(167, 139, 250, 0.3)'
                      : 'rgba(255, 182, 215, 0.18)',
                    '&:hover': {
                      background: onWatchlist
                        ? 'rgba(167, 139, 250, 0.12)'
                        : 'rgba(249, 168, 212, 0.1)',
                    },
                    '&.Mui-disabled': {
                      color: onWatchlist ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                      borderColor: onWatchlist
                        ? 'rgba(167, 139, 250, 0.3)'
                        : 'rgba(255, 182, 215, 0.12)',
                    },
                  }}
                >
                  {onWatchlist ? 'On Watchlist' : 'Add to Watchlist'}
                </Button>
              )}
            </Box>

            {/* Genres */}
            {anime.genres?.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2.5 }}>
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
                mb: 0.8,
              }}
            >
              Synopsis
            </Typography>
            <Typography
              sx={{
                fontSize: '0.88rem',
                lineHeight: 1.65,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              {description}
            </Typography>
          </Box>
        </Box>
      </Fade>
    </Modal>
  )
}

function StatPill({ label }) {
  return (
    <Box
      sx={{
        px: 1.3,
        py: 0.5,
        borderRadius: '999px',
        fontSize: '0.72rem',
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