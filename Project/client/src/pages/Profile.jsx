import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import EditIcon from '@mui/icons-material/Edit'
import AnimeRow from '../components/AnimeRow.jsx'
import AnimeModal from '../components/AnimeModal.jsx'
import EditProfileModal from '../components/EditProfileModal.jsx'
import GenreRadialBadge from '../components/GenreRadialBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getProfileByHandle } from '../services/profile.js'
import { getAnimeByIds } from '../services/anilist.js'
import {
  fetchUserWatchlist,
  fetchUserAnimeRanks,
  updateWatchlistStatus,
  deleteWatchlistEntry,
  upsertAnimeRank,
  deleteAnimeRank,
  reorderAnimeRanks,
} from '../services/api.js'

// Derive unique status values from loaded watchlist entries so the filter
// always reflects whatever text values are actually in the DB — no hardcoding.
function getUniqueStatuses(entries) {
  const seen = new Set()
  const out = []
  for (const e of entries) {
    if (e.status && !seen.has(e.status)) {
      seen.add(e.status)
      out.push(e.status)
    }
  }
  return out
}

function SectionHeader({ children }) {
  return (
    <Typography sx={{
      fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
      mb: 1.5, mt: 4,
    }}>
      {children}
    </Typography>
  )
}

function EmptyState({ message }) {
  return (
    <Box sx={{
      py: 3, px: 2, borderRadius: '14px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px dashed rgba(255, 182, 215, 0.12)',
      textAlign: 'center',
    }}>
      <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>
        {message}
      </Typography>
    </Box>
  )
}

export default function Profile() {
  const { handle } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Watchlist: entries from DB + anime details from AniList
  const [watchlistEntries, setWatchlistEntries] = useState([])
  const [watchlistAnime, setWatchlistAnime] = useState(new Map())
  const [activeFilter, setActiveFilter] = useState('all')

  // Ranked list: entries from DB + anime details from AniList
  const [rankEntries, setRankEntries] = useState([])
  const [rankAnime, setRankAnime] = useState(new Map())

  const [loadingLists, setLoadingLists] = useState(false)

  // Modals
  const [selected, setSelected] = useState(null)
  const [editOpen, setEditOpen] = useState(false)

  const isOwnProfile = user && profile && user.id === profile.id

  // Unique statuses derived from loaded data — no hardcoding
  const availableStatuses = getUniqueStatuses(watchlistEntries)

  // Load profile by handle
  useEffect(() => {
    let cancelled = false
    setLoadingProfile(true)
    setNotFound(false)
    setProfile(null)

    getProfileByHandle(handle).then((data) => {
      if (cancelled) return
      if (!data) setNotFound(true)
      else setProfile(data)
      setLoadingProfile(false)
    })

    return () => { cancelled = true }
  }, [handle])

  // Load watchlist + rankings once we have the profile id
  useEffect(() => {
    if (!profile?.id) return
    let cancelled = false

    async function loadLists() {
      setLoadingLists(true)
      try {
        const [watchlist, ranks] = await Promise.all([
          fetchUserWatchlist(profile.id),
          fetchUserAnimeRanks(profile.id),
        ])

        if (cancelled) return

        setWatchlistEntries(watchlist)
        setRankEntries(ranks)

        // Coerce anime_id to number everywhere — Postgres may return them as
        // strings, but AniList's map keys are always numbers
        const allIds = [...new Set([
          ...watchlist.map((e) => Number(e.anime_id)),
          ...ranks.map((e) => Number(e.anime_id)),
        ])]

        if (allIds.length === 0) return

        const animeMap = await getAnimeByIds(allIds)
        if (!cancelled) {
          setWatchlistAnime(animeMap)
          setRankAnime(animeMap)
        }
      } catch (err) {
        console.error('Failed to load profile lists:', err)
      } finally {
        if (!cancelled) setLoadingLists(false)
      }
    }

    loadLists()
    return () => { cancelled = true }
  }, [profile?.id])

  // ─── Watchlist actions ────────────────────────────────────────────────────

  async function handleStatusChange(animeId, newStatus) {
    if (!user) return
    try {
      await updateWatchlistStatus(user.id, animeId, newStatus)
      setWatchlistEntries((prev) =>
        prev.map((e) => Number(e.anime_id) === Number(animeId) ? { ...e, status: newStatus } : e)
      )
    } catch (err) {
      console.error('Failed to update status:', err.message)
    }
  }

  async function handleDeleteFromWatchlist(animeId) {
    if (!user) return
    try {
      await deleteWatchlistEntry(user.id, animeId)
      setWatchlistEntries((prev) => prev.filter((e) => Number(e.anime_id) !== Number(animeId)))
    } catch (err) {
      console.error('Failed to delete watchlist entry:', err.message)
    }
  }

  // ─── Ranked list actions ──────────────────────────────────────────────────

  async function handleRating(animeId, rating) {
    if (!user) return
    try {
      await upsertAnimeRank(user.id, animeId, rating)
      setRankEntries((prev) => {
        const exists = prev.find((e) => Number(e.anime_id) === Number(animeId))
        if (exists) {
          // Just update the rating value — do NOT re-sort. Position is now
          // controlled entirely by drag-and-drop, not by rating value.
          return prev.map((e) =>
            Number(e.anime_id) === Number(animeId) ? { ...e, rating } : e
          )
        }
        // New rank entry — fetch the anime from whichever map has it and
        // add to rankAnime if not already there. New entries land at the
        // end of the list (matching the backend's default position).
        const anime = watchlistAnime.get(Number(animeId))
        if (anime) {
          setRankAnime((prev) => new Map(prev).set(Number(animeId), anime))
        }
        return [...prev, { anime_id: animeId, rating }]
      })
    } catch (err) {
      console.error('Failed to upsert anime rank:', err.message)
    }
  }

  async function handleDeleteRank(animeId) {
    if (!user) return
    try {
      await deleteAnimeRank(user.id, animeId)
      setRankEntries((prev) => prev.filter((e) => Number(e.anime_id) !== Number(animeId)))
    } catch (err) {
      console.error('Failed to delete rank:', err.message)
    }
  }

  // ─── Drag-and-drop reordering for the Top Rated list ──────────────────────
  // Uses native HTML5 drag events — no extra library needed for a simple
  // single-column vertical reorder. dragIndex tracks which row is currently
  // being dragged so we can compute the new order on drop.

  const [dragIndex, setDragIndex] = useState(null)

  function handleDragStart(index) {
    setDragIndex(index)
  }

  function handleDragOver(e, overIndex) {
    e.preventDefault() // required to allow dropping
    if (dragIndex === null || dragIndex === overIndex) return

    setRankEntries((prev) => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(overIndex, 0, moved)
      return next
    })
    setDragIndex(overIndex)
  }

  async function handleDragEnd() {
    setDragIndex(null)
    if (!user) return

    try {
      const order = rankEntries.map((e) => Number(e.anime_id))
      await reorderAnimeRanks(user.id, order)
    } catch (err) {
      console.error('Failed to save new order:', err.message)
    }
  }

  // ─── Profile edit ─────────────────────────────────────────────────────────

  function handleProfileSaved(updated) {
    setProfile((prev) => ({ ...prev, ...updated }))
  }

  // ─── Filtered watchlist ───────────────────────────────────────────────────

  const filteredWatchlist = activeFilter === 'all'
    ? watchlistEntries
    : watchlistEntries.filter((e) => e.status === activeFilter)

  // Resolved anime objects for the FULL watchlist (not the filtered view) —
  // the genre badge should reflect everything on the list regardless of
  // which status filter is currently active.
  const watchlistAnimeList = watchlistEntries
    .map((e) => watchlistAnime.get(Number(e.anime_id)))
    .filter(Boolean)

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: '#e879a0' }} />
      </Box>
    )
  }

  if (notFound || !profile) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#f1e9ff', mb: 1 }}>
          🌸 User not found
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}>
          No user with the handle @{handle} exists.
        </Typography>
        <Button onClick={() => navigate('/')} sx={{ color: '#f9a8d4', fontWeight: 700, textTransform: 'none' }}>
          ← Back to home
        </Button>
      </Container>
    )
  }

  return (
    <Box>
      {/* Banner */}
      <Box sx={{
        width: '100%',
        height: { xs: 120, sm: 160 },
        background: 'linear-gradient(135deg, #2d1b4e 0%, #1e1535 50%, #2a1040 100%)',
        borderBottom: '1px solid rgba(255, 182, 215, 0.1)',
      }} />

      <Container sx={{ pb: 8 }}>
        {/* Avatar + edit button */}
        <Box sx={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 2, mt: { xs: -5, sm: -6 }, mb: 3,
        }}>
          <Avatar
            src={profile.avatar}
            alt={profile.username}
            sx={{
              width: { xs: 80, sm: 100 }, height: { xs: 80, sm: 100 },
              border: '4px solid #120d1e', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              fontSize: '2rem',
            }}
          />
          {isOwnProfile && (
            <Button
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => setEditOpen(true)}
              sx={{
                fontWeight: 700, fontSize: '0.8rem', textTransform: 'none',
                color: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(255, 182, 215, 0.18)', borderRadius: '20px',
                px: 2, py: 0.7,
                '&:hover': { color: '#f9a8d4', background: 'rgba(249,168,212,0.08)', borderColor: 'rgba(249,168,212,0.35)' },
              }}
            >
              Edit Profile
            </Button>
          )}
        </Box>

        {/* Username / handle / bio */}
        <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#f1e9ff', lineHeight: 1.2 }}>
          {profile.username}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', mt: 0.3, mb: 1 }}>
          @{profile.handle}
        </Typography>
        {profile.bio ? (
          <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', maxWidth: 520, lineHeight: 1.6 }}>
            {profile.bio}
          </Typography>
        ) : isOwnProfile ? (
          <Typography
            sx={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', cursor: 'pointer' }}
            onClick={() => setEditOpen(true)}
          >
            No bio yet — click Edit Profile to add one.
          </Typography>
        ) : null}

        <Divider sx={{ borderColor: 'rgba(255, 182, 215, 0.08)', mt: 4 }} />

        {/* ── Top Rated ── */}
        <SectionHeader>⭐ Top Rated Anime</SectionHeader>

        {loadingLists ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: '#e879a0' }} />
          </Box>
        ) : rankEntries.length === 0 ? (
          <EmptyState message="No personal rankings yet. Rate an anime from your watchlist to add it here." />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {rankEntries.map((entry, index) => {
              const anime = rankAnime.get(Number(entry.anime_id))
              if (!anime) return null
              return (
                <Box
                  key={entry.anime_id}
                  draggable={isOwnProfile}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  sx={{
                    opacity: dragIndex === index ? 0.4 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <AnimeRow
                    anime={anime}
                    rank={index + 1}
                    personalRating={entry.rating}
                    dragHandleProps={isOwnProfile ? {} : undefined}
                    onClick={() => setSelected(anime)}
                    onDelete={isOwnProfile ? () => handleDeleteRank(entry.anime_id) : undefined}
                  />
                </Box>
              )
            })}
          </Box>
        )}

        <Divider sx={{ borderColor: 'rgba(255, 182, 215, 0.08)', mt: 4 }} />

        {/* ── Watch List + Genre Breakdown side-by-side ── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            mt: 4,
          }}
        >
          {/* Watch List (main column) */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 1, mb: 1.5,
            }}>
              <Typography sx={{
                fontWeight: 800, fontSize: '0.72rem', letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
              }}>
                📋 Watch List
              </Typography>

              {/* Filter pills — built from actual status values in the data */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {['all', ...availableStatuses].map((f) => {
                  const active = activeFilter === f
                  const label = f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)
                  return (
                    <Box
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      role="button"
                      sx={{
                        px: 1.4, py: 0.35, borderRadius: '999px',
                        fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                        border: '1px solid',
                        borderColor: active ? 'rgba(249,168,212,0.45)' : 'rgba(255,255,255,0.1)',
                        color: active ? '#f9a8d4' : 'rgba(255,255,255,0.45)',
                        background: active ? 'rgba(249,168,212,0.08)' : 'transparent',
                        transition: 'all 0.15s ease',
                        '&:hover': { borderColor: 'rgba(249,168,212,0.3)', color: '#f9a8d4' },
                      }}
                    >
                      {label}
                    </Box>
                  )
                })}
              </Box>
            </Box>

            {loadingLists ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} sx={{ color: '#e879a0' }} />
              </Box>
            ) : filteredWatchlist.length === 0 ? (
              <EmptyState message={
                activeFilter === 'all'
                  ? 'Nothing on the watchlist yet.'
                  : `No anime with status "${activeFilter}" yet.`
              } />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {filteredWatchlist.map((entry) => {
                  const anime = watchlistAnime.get(Number(entry.anime_id))
                  if (!anime) return null
                  // Get existing personal rating for this anime if any
                  const existingRank = rankEntries.find(
                    (r) => Number(r.anime_id) === Number(entry.anime_id)
                  )
                  return (
                    <AnimeRow
                      key={entry.anime_id}
                      anime={anime}
                      status={entry.status}
                      aniListScore={anime.averageScore}
                      personalRating={existingRank?.rating ?? null}
                      onClick={() => setSelected(anime)}
                      onStatusChange={isOwnProfile
                        ? (newStatus) => handleStatusChange(entry.anime_id, newStatus)
                        : undefined
                      }
                      onDelete={isOwnProfile
                        ? () => handleDeleteFromWatchlist(entry.anime_id)
                        : undefined
                      }
                      onRate={isOwnProfile
                        ? (rating) => handleRating(entry.anime_id, rating)
                        : undefined
                      }
                    />
                  )
                })}
              </Box>
            )}
          </Box>

          {/* Genre Breakdown (side column) — reflects the FULL watchlist
              regardless of the active status filter above */}
          <Box sx={{ width: { xs: '100%', md: 240 }, flexShrink: 0 }}>
            <GenreRadialBadge watchlistAnime={watchlistAnimeList} />
          </Box>
        </Box>
      </Container>

      <AnimeModal
        anime={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />

      {isOwnProfile && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </Box>
  )
}