import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'

/**
 * AnimeCard
 * Shows cover image, title, and rating.
 * Click opens the full-detail modal (handled by parent via onSelect).
 *
 * Props:
 *  - anime: AniList media object (see lib/anilist.js for shape)
 *  - onSelect: (anime) => void — called when the card is clicked
 *  - rank: optional 1-based position in the list (e.g. 1 for #1 top rated).
 *          Omit to hide the rank badge entirely.
 */
export default function AnimeCard({ anime, onSelect, rank }) {
  const [imgLoaded, setImgLoaded] = useState(false)

  const title = anime.title?.english || anime.title?.romaji || 'Untitled'
  const cover = anime.coverImage?.large
  const score = anime.averageScore // 0–100 from AniList

  return (
    <Box
      onClick={() => onSelect?.(anime)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect?.(anime)
      }}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '2 / 3',
        borderRadius: '14px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#1e1535',
        border: '1px solid rgba(255, 182, 215, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        outline: 'none',
        '&:hover, &:focus-visible': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(249, 168, 212, 0.45)',
          boxShadow: '0 10px 28px rgba(232, 121, 160, 0.25)',
        },
        '&:hover .anime-card-overlay, &:focus-visible .anime-card-overlay': {
          opacity: 1,
        },
      }}
    >
      {/* Cover image */}
      {!imgLoaded && (
        <Skeleton
          variant="rectangular"
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.06)',
          }}
        />
      )}
      {cover && (
        <Box
          component="img"
          src={cover}
          alt={title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imgLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Gradient overlay for text legibility */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(18,13,30,0) 45%, rgba(18,13,30,0.85) 80%, rgba(18,13,30,0.96) 100%)',
        }}
      />

      {/* Rank badge */}
      {rank != null && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            px: 1,
            py: 0.3,
            borderRadius: '999px',
            background: 'rgba(18, 13, 30, 0.75)',
            border: '1px solid rgba(167, 139, 250, 0.35)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              background: 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}
          >
            #{rank}
          </Typography>
        </Box>
      )}

      {/* Rating badge */}
      {score != null && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.4,
            px: 1,
            py: 0.3,
            borderRadius: '999px',
            background: 'rgba(18, 13, 30, 0.75)',
            border: '1px solid rgba(255, 182, 215, 0.25)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Typography sx={{ fontSize: '0.7rem' }}>⭐</Typography>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#f9d4e4',
              lineHeight: 1,
            }}
          >
            {(score / 10).toFixed(1)}
          </Typography>
        </Box>
      )}

      {/* Title + soft hover hint */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 1.25,
        }}
      >
        <Typography
          title={title}
          sx={{
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#f1e9ff',
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </Typography>

        <Box
          className="anime-card-overlay"
          sx={{
            opacity: 0,
            transition: 'opacity 0.2s ease',
            mt: 0.5,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.03em',
              background: 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            View details →
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}