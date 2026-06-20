import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Sakura/lavender-coordinated palette, cycled through for however many
// distinct genres appear. Kept to 6 — beyond that a radial chart turns to
// visual noise, so the 6th slot becomes "Other" and absorbs the rest.
const SLICE_COLORS = ['#e879a0', '#a78bfa', '#93c5fd', '#86efac', '#fbbf75', '#fca5a5']
const MAX_SLICES = 6

const SIZE = 160
const STROKE_WIDTH = 18
const RADIUS = (SIZE - STROKE_WIDTH) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * GenreRadialBadge
 * A small donut chart breaking down a user's watchlist by genre.
 * Built purely from anime objects already loaded for the watchlist —
 * no extra fetch needed.
 *
 * Props:
 *  - watchlistAnime: array of AniList media objects currently on the
 *    watchlist (NOT the Map — pass the resolved anime objects directly)
 */
export default function GenreRadialBadge({ watchlistAnime }) {
  const slices = useMemo(() => computeGenreSlices(watchlistAnime), [watchlistAnime])
  // Total titles on the watchlist — NOT the sum of genre slice counts,
  // since most anime have multiple genres and would otherwise be counted
  // more than once (e.g. an anime tagged Action+Fantasy+Adventure would
  // add 3 to a summed total instead of 1).
  const titleCount = watchlistAnime.length
  // Still needed for computing each slice's percentage of the ring
  const genreOccurrences = slices.reduce((sum, s) => sum + s.count, 0)

  if (titleCount === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          py: 4,
          px: 2,
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255, 182, 215, 0.12)',
          height: 400,
        }}
      >
        <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          Genre breakdown appears once anime are added to the watchlist.
        </Typography>
      </Box>
    )
  }

  // Build cumulative offsets so each slice knows where to start on the ring.
  // Percentages are share-of-genre-tags (genreOccurrences), since that's
  // what the ring visually represents — distinct from titleCount shown
  // in the center, which is share-of-watchlist-titles.
  let cumulative = 0
  const segments = slices.map((slice) => {
    const fraction = slice.count / genreOccurrences
    const length = fraction * CIRCUMFERENCE
    const offset = cumulative
    cumulative += length
    return { ...slice, length, offset, fraction }
  })

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2.5,
        borderRadius: '16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255, 182, 215, 0.08)',
        // Fixed height instead of 100% — without this, the badge stretches
        // to match its sibling column's height in the flex layout, which
        // grows as more titles are added to the watchlist next to it.
        height: 400,
        overflow: 'hidden',
        position: 'sticky',
        top: 16,
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          alignSelf: 'flex-start',
        }}
      >
        🎭 Genre Breakdown
      </Typography>

      <Box sx={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Track background ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Colored segments, rotated so the first slice starts at 12 o'clock */}
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {segments.map((seg) => (
              <circle
                key={seg.genre}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                strokeDashoffset={-seg.offset}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
              />
            ))}
          </g>
        </svg>

        {/* Center label */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '1.4rem',
              background: 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}
          >
            {titleCount}
          </Typography>
          <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', mt: 0.3 }}>
            titles
          </Typography>
        </Box>
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.7, width: '100%' }}>
        {segments.map((seg) => (
          <Box key={seg.genre} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: seg.color,
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.65)',
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {seg.genre}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
              {Math.round(seg.fraction * 100)}%
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// Counts genre occurrences across all watchlist anime, then collapses
// anything beyond the top 5 into a 6th "Other" slice so the chart stays
// readable regardless of how varied someone's taste is.
function computeGenreSlices(animeList) {
  const counts = new Map()

  for (const anime of animeList) {
    for (const genre of anime.genres ?? []) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])

  const top = sorted.slice(0, MAX_SLICES - 1)
  const rest = sorted.slice(MAX_SLICES - 1)
  const otherCount = rest.reduce((sum, [, count]) => sum + count, 0)

  const slices = top.map(([genre, count], i) => ({
    genre,
    count,
    color: SLICE_COLORS[i],
  }))

  if (otherCount > 0) {
    slices.push({ genre: 'Other', count: otherCount, color: SLICE_COLORS[MAX_SLICES - 1] })
  }

  return slices
}