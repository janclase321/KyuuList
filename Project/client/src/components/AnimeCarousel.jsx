import { useRef, useState, useCallback } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AnimeCard from './AnimeCard.jsx'

const CARD_WIDTH = 170 // px, matches the basis below
const GAP = 16 // px, matches the gap below

/**
 * AnimeCarousel
 * A single horizontal row of anime cards. Arrow buttons (and natural touch/
 * trackpad swipe) shift the row sideways. When the user gets close to the
 * end, onNearEnd fires so the parent can fetch + append the next page.
 *
 * Props:
 *  - animeList: array of AniList media objects, already loaded
 *  - onSelect: (anime) => void — card click handler
 *  - onNearEnd: () => void — called once when scrolled near the last card
 *  - loadingMore: boolean — shows trailing skeleton cards while fetching
 *  - showRank: boolean — when true, passes #1/#2/... badges to each card
 *              based on list position. Defaults to false (e.g. for an
 *              "upcoming" row sorted by date, where rank isn't meaningful).
 */
export default function AnimeCarousel({
  animeList,
  onSelect,
  onNearEnd,
  loadingMore,
  showRank = false,
}) {
  console.log('AnimeCarousel render, animeList =', animeList)
  const trackRef = useRef(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const hasFiredNearEnd = useRef(false)

  const scrollByAmount = (direction) => {
    const track = trackRef.current
    if (!track) return
    const amount = (CARD_WIDTH + GAP) * 3 * direction // shift ~3 cards at a time
    track.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const { scrollLeft, scrollWidth, clientWidth } = track
    setAtStart(scrollLeft <= 4)
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 4)

    // Fire onNearEnd once per approach — reset when the list grows
    const nearEnd = scrollLeft + clientWidth >= scrollWidth - (CARD_WIDTH + GAP) * 3
    if (nearEnd && !hasFiredNearEnd.current) {
      hasFiredNearEnd.current = true
      onNearEnd?.()
    }
    if (!nearEnd) {
      hasFiredNearEnd.current = false
    }
  }, [onNearEnd])

  return (
    <Box sx={{ position: 'relative', mx: -1, my: -2 }}>
      {/* Left arrow */}
      <NavButton
        direction="left"
        visible={!atStart}
        onClick={() => scrollByAmount(-1)}
      />

      {/* Track */}
      <Box
        ref={trackRef}
        onScroll={handleScroll}
        sx={{
          display: 'flex',
          gap: `${GAP}px`,
          overflowX: 'auto',
          overflowY: 'visible',
          scrollSnapType: 'x mandatory',
          px: 1,
          // Extra top/bottom padding gives the card's hover lift + glow room
          // to render without being clipped by overflowX: auto.
          py: 2,
          // Hide scrollbar but keep native touch/trackpad scroll + momentum
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          WebkitOverflowScrolling: 'touch',
        }}
      >        {animeList.map((anime, index) => (
          <Box
            key={anime.id}
            sx={{
              flex: `0 0 ${CARD_WIDTH}px`,
              scrollSnapAlign: 'start',
            }}
          >
            <AnimeCard
              anime={anime}
              onSelect={onSelect}
              rank={showRank ? index + 1 : undefined}
            />
          </Box>
        ))}

        {loadingMore &&
          Array.from({ length: 4 }).map((_, i) => (
            <Box
              key={`skeleton-${i}`}
              sx={{
                flex: `0 0 ${CARD_WIDTH}px`,
                aspectRatio: '2 / 3',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)',
              }}
            />
          ))}
      </Box>

      {/* Right arrow */}
      <NavButton
        direction="right"
        visible={!atEnd}
        onClick={() => scrollByAmount(1)}
      />
    </Box>
  )
}

function NavButton({ direction, visible, onClick }) {
  const isLeft = direction === 'left'
  return (
    <IconButton
      onClick={onClick}
      aria-label={isLeft ? 'Scroll left' : 'Scroll right'}
      sx={{
        position: 'absolute',
        top: 'calc(38% + 16px)',
        [isLeft ? 'left' : 'right']: -14,
        zIndex: 3,
        width: 36,
        height: 36,
        color: '#fff',
        background: 'rgba(26, 18, 40, 0.85)',
        border: '1px solid rgba(255, 182, 215, 0.25)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.2s ease, background 0.2s ease, transform 0.15s ease',
        '&:hover': {
          background: 'rgba(232, 121, 160, 0.35)',
          transform: 'translateY(-1px) scale(1.05)',
        },
      }}
    >
      {isLeft ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
    </IconButton>
  )
}