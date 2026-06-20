import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'

const STATUS_STYLES = {
  'watching':      { label: 'Watching',      color: '#86efac', bg: 'rgba(134,239,172,0.1)', border: 'rgba(134,239,172,0.25)' },
  'plan to watch': { label: 'Plan to Watch', color: '#93c5fd', bg: 'rgba(147,197,253,0.1)', border: 'rgba(147,197,253,0.25)' },
  'completed':     { label: 'Completed',     color: '#c4b5fd', bg: 'rgba(196,181,253,0.1)', border: 'rgba(196,181,253,0.25)' },
  'dropped':       { label: 'Dropped',       color: '#fca5a5', bg: 'rgba(252,165,165,0.1)', border: 'rgba(252,165,165,0.25)' },
}

// Status is freeform text in the DB — fall back to a neutral style and the
// raw text itself (title-cased) for any value not in the map above, instead
// of hardcoding a closed list of allowed statuses.
function getStatusStyle(status) {
  const key = status?.toLowerCase()
  if (STATUS_STYLES[key]) return STATUS_STYLES[key]
  return {
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : status,
    color: 'rgba(255,255,255,0.6)',
    bg: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.12)',
  }
}

// Known statuses offered in the dropdown. Since status is freeform text,
// this is just a sensible default menu — typing-in-custom-status isn't
// supported here, but any existing DB value still displays correctly
// via getStatusStyle's fallback above.
const STATUS_OPTIONS = ['watching', 'plan to watch', 'completed', 'dropped']

/**
 * AnimeRow
 * A horizontal "progress card" row for the profile page. Used for both the
 * watch list (status + AniList score + personal rating) and the top-rated
 * list (drag handle + personal rating only).
 *
 * Props:
 *  - anime: AniList media object
 *  - status: string — freeform watchlist status text (omit for top-rated rows)
 *  - aniListScore: number — AniList's averageScore on its native 0-100
 *                  scale. Displayed as a gold-star pill (e.g. 8.5).
 *  - personalRating: number | null — the user's own rating, any decimal
 *                     (e.g. 7.3). Displayed as a separate pink pill,
 *                     distinct from the AniList score.
 *  - rank: optional number — shown as #1, #2... (read-only; NOT used for
 *          top-rated ordering anymore, that's drag-and-drop now)
 *  - dragHandleProps: optional — spread onto a drag handle icon when this
 *                      row is used in a sortable top-rated list
 *  - onClick: () => void — opens the detail modal
 *  - onStatusChange: (newStatus) => void — shows an editable status dropdown
 *  - onRate: (rating) => void — shows a decimal personal-rating input
 *  - onDelete: () => void — shows a delete icon button on the right
 */
export default function AnimeRow({
  anime,
  status,
  aniListScore,
  personalRating,
  rank,
  dragHandleProps,
  onClick,
  onStatusChange,
  onRate,
  onDelete,
}) {
  const [statusAnchor, setStatusAnchor] = useState(null)
  const [rateAnchor, setRateAnchor] = useState(null)
  const [ratingInput, setRatingInput] = useState(
    personalRating != null ? String(personalRating) : ''
  )

  const title = anime.title?.english || anime.title?.romaji || 'Untitled'
  const cover = anime.coverImage?.large

  const displayAniListScore = aniListScore != null ? (aniListScore / 10).toFixed(1) : null
  const displayPersonalRating = personalRating != null ? Number(personalRating).toFixed(1) : null

  function stop(e) {
    e.stopPropagation()
  }

  function handleStatusSelect(newStatus) {
    setStatusAnchor(null)
    if (newStatus !== status) onStatusChange?.(newStatus)
  }

  function handleRateSubmit(e) {
    e.preventDefault()
    const parsed = parseFloat(ratingInput)
    if (Number.isNaN(parsed)) return
    // Clamp to a sane 0-10 range with one decimal place
    const clamped = Math.max(0, Math.min(10, Math.round(parsed * 10) / 10))
    setRateAnchor(null)
    onRate?.(clamped)
  }

  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick()
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1.5,
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255, 182, 215, 0.07)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.18s ease, border-color 0.18s ease',
        outline: 'none',
        '&:hover': onClick ? {
          background: 'rgba(255,255,255,0.05)',
          borderColor: 'rgba(249, 168, 212, 0.2)',
        } : {},
        '&:focus-visible': { borderColor: 'rgba(249, 168, 212, 0.5)' },
      }}
    >
      {/* Drag handle (top-rated section only) */}
      {dragHandleProps && (
        <Box
          {...dragHandleProps}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            flexShrink: 0,
            color: 'rgba(255,255,255,0.25)',
            cursor: 'grab',
            fontSize: '1rem',
            lineHeight: 1,
            '&:active': { cursor: 'grabbing' },
            '&:hover': { color: 'rgba(249, 168, 212, 0.6)' },
          }}
          onClick={stop}
        >
          ⠿
        </Box>
      )}

      {/* Rank number — read-only display, shown alongside the drag handle
          when present. No longer drives ordering, just shows current position. */}
      {rank != null && (
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: '0.75rem',
            minWidth: 24,
            textAlign: 'right',
            background: 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            flexShrink: 0,
          }}
        >
          #{rank}
        </Typography>
      )}

      {/* Cover thumbnail */}
      <Box
        component="img"
        src={cover}
        alt={title}
        loading="lazy"
        sx={{
          width: 42,
          height: 60,
          borderRadius: '8px',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid rgba(255, 182, 215, 0.1)',
        }}
      />

      {/* Title + status */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.9rem',
            color: '#f1e9ff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </Typography>

        {status && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.5 }}>
            <StatusPill
              status={status}
              editable={Boolean(onStatusChange)}
              onClick={onStatusChange ? (e) => { stop(e); setStatusAnchor(e.currentTarget) } : undefined}
            />

            {onStatusChange && (
              <Menu
                anchorEl={statusAnchor}
                open={Boolean(statusAnchor)}
                onClose={() => setStatusAnchor(null)}
                onClick={stop}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 0.5,
                      background: '#1a1228',
                      border: '1px solid rgba(255, 182, 215, 0.15)',
                      borderRadius: '12px',
                      minWidth: 160,
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    },
                  },
                }}
              >
                {STATUS_OPTIONS.map((s) => {
                  const style = getStatusStyle(s)
                  const isCurrent = s.toLowerCase() === status?.toLowerCase()
                  return (
                    <MenuItem
                      key={s}
                      selected={isCurrent}
                      onClick={() => handleStatusSelect(s)}
                      sx={{
                        fontSize: '0.82rem',
                        fontWeight: isCurrent ? 700 : 500,
                        color: style.color,
                        '&:hover': { background: style.bg },
                        '&.Mui-selected': { background: style.bg, '&:hover': { background: style.bg } },
                      }}
                    >
                      {style.label}
                    </MenuItem>
                  )
                })}
              </Menu>
            )}

            {/* Personal rating — only shown when onRate is provided (watchlist rows) */}
            {onRate && (
              <>
                <Box
                  component="span"
                  onClick={(e) => {
                    stop(e)
                    setRatingInput(personalRating != null ? String(personalRating) : '')
                    setRateAnchor(e.currentTarget)
                  }}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.3,
                    px: 1,
                    py: 0.2,
                    borderRadius: '999px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: personalRating != null ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                    background: personalRating != null ? 'rgba(167, 139, 250, 0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${personalRating != null ? 'rgba(167, 139, 250, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                    userSelect: 'none',
                    transition: 'opacity 0.15s',
                    '&:hover': { opacity: 0.8 },
                  }}
                >
                  <Box component="span" sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                    💜
                  </Box>
                  {displayPersonalRating != null ? `${displayPersonalRating}/10` : 'Rate'}
                </Box>

                <Menu
                  anchorEl={rateAnchor}
                  open={Boolean(rateAnchor)}
                  onClose={() => setRateAnchor(null)}
                  onClick={stop}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 0.5,
                        background: '#1a1228',
                        border: '1px solid rgba(255, 182, 215, 0.15)',
                        borderRadius: '12px',
                        p: 1.5,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      },
                    },
                  }}
                >
                  <Box
                    component="form"
                    onSubmit={handleRateSubmit}
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 160 }}
                  >
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
                      Your rating (0–10)
                    </Typography>
                    <Box
                      component="input"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      autoFocus
                      value={ratingInput}
                      onChange={(e) => setRatingInput(e.target.value)}
                      placeholder="e.g. 8.5"
                      sx={{
                        width: '100%',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#f1e9ff',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(167, 139, 250, 0.25)',
                        borderRadius: '8px',
                        px: 1.2,
                        py: 0.8,
                        outline: 'none',
                        boxSizing: 'border-box',
                        '&:focus': { borderColor: '#a78bfa' },
                      }}
                    />
                    <Box
                      component="button"
                      type="submit"
                      sx={{
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        py: 0.7,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#fff',
                        background: 'linear-gradient(135deg, #e879a0 0%, #a78bfa 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #f472b6 0%, #c4b5fd 100%)',
                        },
                      }}
                    >
                      Save Rating
                    </Box>
                  </Box>
                </Menu>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* AniList score — gold star, read-only */}
      {displayAniListScore != null && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 44 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <Typography sx={{ fontSize: '0.85rem', lineHeight: 1, color: '#fbbf24' }}>★</Typography>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#fbbf24',
                lineHeight: 1,
              }}
            >
              {displayAniListScore}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', mt: 0.3 }}>
            AniList
          </Typography>
        </Box>
      )}

      {/* Personal rating — distinct pink/lavender styling, read-only display
          (the editable version lives in the status row above via onRate) */}
      {displayPersonalRating != null && !onRate && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 44 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: '0.95rem',
              background: 'linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}
          >
            {displayPersonalRating}
          </Typography>
          <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', mt: 0.3 }}>
            personal rating
          </Typography>
        </Box>
      )}

      {/* Delete button */}
      {onDelete && (
        <IconButton
          size="small"
          onClick={(e) => { stop(e); onDelete() }}
          aria-label="Remove"
          sx={{
            flexShrink: 0,
            color: 'rgba(255,255,255,0.3)',
            fontSize: '1rem',
            '&:hover': { color: '#f87171', background: 'rgba(248, 113, 113, 0.1)' },
          }}
        >
          ✕
        </IconButton>
      )}
    </Box>
  )
}

function StatusPill({ status, editable, onClick }) {
  const style = getStatusStyle(status)

  return (
    <Box
      component="span"
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.3,
        px: 1,
        py: 0.2,
        borderRadius: '999px',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.03em',
        color: style.color,
        background: style.bg,
        border: `1px solid ${style.border}`,
        cursor: editable ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'opacity 0.15s',
        '&:hover': editable ? { opacity: 0.8 } : {},
      }}
    >
      {style.label}
      {editable && (
        <Box component="span" sx={{ fontSize: '0.7rem', ml: 0.2, lineHeight: 1 }}>
          ▾
        </Box>
      )}
    </Box>
  )
}