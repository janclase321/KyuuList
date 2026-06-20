import { useEffect, useRef, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'

const SLIDE_DURATION = 5000 // ms between auto-advances
const FADE_DURATION = 500 // ms cross-fade transition

/**
 * HeroSlideshow
 * Auto-rotating banner of trending anime for the top of the homepage.
 * Fades between slides every SLIDE_DURATION ms. Click dots to jump directly
 * to a slide; hovering pauses auto-advance.
 *
 * Props:
 *  - animeList: array of AniList media objects (trending anime)
 *  - onSelect: (anime) => void — "More info" click handler, opens modal
 *  - loading: boolean — shows skeleton while the initial fetch is in flight
 */
export default function HeroSlideshow({ animeList, onSelect, loading }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)

  const goTo = useCallback(
    (index) => {
      if (!animeList?.length) return
      setActiveIndex(((index % animeList.length) + animeList.length) % animeList.length)
    },
    [animeList]
  )

  // Auto-advance timer
  useEffect(() => {
    if (paused || !animeList?.length || animeList.length <= 1) return

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % animeList.length)
    }, SLIDE_DURATION)

    return () => clearInterval(timerRef.current)
  }, [paused, animeList?.length])

  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        sx={{
          width: '100%',
          height: { xs: 320, sm: 400, md: 480 },
          borderRadius: '20px',
          bgcolor: 'rgba(255,255,255,0.04)',
        }}
      />
    )
  }

  if (!animeList?.length) return null

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        position: 'relative',
        width: '100%',
        height: { xs: 320, sm: 400, md: 480 },
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 182, 215, 0.12)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
      }}
    >
      {animeList.map((anime, index) => (
        <Slide
          key={anime.id}
          anime={anime}
          active={index === activeIndex}
          onSelect={onSelect}
        />
      ))}

      {/* Dot navigation */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 18,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          zIndex: 3,
        }}
      >
        {animeList.map((_, index) => (
          <Box
            key={index}
            onClick={() => goTo(index)}
            role="button"
            aria-label={`Go to slide ${index + 1}`}
            sx={{
              width: index === activeIndex ? 22 : 8,
              height: 8,
              borderRadius: '999px',
              cursor: 'pointer',
              background:
                index === activeIndex
                  ? 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 100%)'
                  : 'rgba(255,255,255,0.3)',
              transition: 'width 0.3s ease, background 0.3s ease',
              '&:hover': {
                background:
                  index === activeIndex
                    ? 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 100%)'
                    : 'rgba(255,255,255,0.5)',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  )
}

function Slide({ anime, active, onSelect }) {
  const title = anime.title?.english || anime.title?.romaji || 'Untitled'
  const banner = anime.bannerImage || anime.coverImage?.large
  const score = anime.averageScore

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        opacity: active ? 1 : 0,
        transition: `opacity ${FADE_DURATION}ms ease`,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      {/* Background image */}
      <Box
        component="img"
        src={banner}
        alt={title}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Gradient overlays for legibility — darker on the left for text,
          subtle dark fade at the bottom for the dot nav */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(18,13,30,0.95) 0%, rgba(18,13,30,0.55) 45%, rgba(18,13,30,0.15) 75%, rgba(18,13,30,0.05) 100%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(18,13,30,0) 60%, rgba(18,13,30,0.75) 100%)',
        }}
      />

      {/* Content */}
      <Box
        sx={{
          position: 'absolute',
          left: { xs: 20, sm: 36, md: 48 },
          bottom: { xs: 56, sm: 64 },
          right: { xs: 20, sm: '40%' },
        }}
      >
        <Chip
          label="Trending"
          size="small"
          sx={{
            mb: 1.5,
            fontWeight: 700,
            fontSize: '0.7rem',
            color: '#f9d4e4',
            background: 'rgba(232, 121, 160, 0.15)',
            border: '1px solid rgba(232, 121, 160, 0.35)',
          }}
        />

        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
            lineHeight: 1.15,
            color: '#f1e9ff',
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
          {score != null && (
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#f9d4e4',
              }}
            >
              ⭐ {(score / 10).toFixed(1)}
            </Typography>
          )}
          {anime.genres?.slice(0, 3).map((genre) => (
            <Typography
              key={genre}
              sx={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.6)',
                '&::before': { content: '"•"', mr: 1.2, opacity: 0.5 },
              }}
            >
              {genre}
            </Typography>
          ))}
        </Box>

        <Typography
          sx={{
            display: { xs: 'none', sm: '-webkit-box' },
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.7)',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 2.5,
            maxWidth: 480,
          }}
        >
          {(anime.description || '').replace(/<br\s*\/?>/gi, ' ').replace(/<\/?i>/gi, '')}
        </Typography>

        <Button
          variant="contained"
          onClick={() => onSelect?.(anime)}
          sx={{
            background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'none',
            px: 3,
            py: 1,
            borderRadius: '20px',
            boxShadow: '0 0 16px rgba(232, 121, 160, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
              boxShadow: '0 0 24px rgba(232, 121, 160, 0.6)',
            },
          }}
        >
          More Info
        </Button>
      </Box>
    </Box>
  )
}