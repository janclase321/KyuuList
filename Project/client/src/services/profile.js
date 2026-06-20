import { supabase } from './supabaseClient.js'

/**
 * Fetch a user's public profile by their handle (e.g. "@jan").
 * Returns the row from `users`, or null if not found.
 */
export async function getProfileByHandle(handle) {
  // Normalise — strip leading @ if the caller includes it
  const clean = handle.startsWith('@') ? handle.slice(1) : handle

  const { data, error } = await supabase
    .from('users')
    .select('id, username, handle, bio, avatar')
    .eq('handle', clean)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch profile:', error.message)
    return null
  }
  return data
}

/**
 * Fetch all watchlist entries for a user.
 * Returns an array of { anime_id, status } sorted by status group:
 * watching first, then plan_to_watch, completed, dropped.
 */
export async function getUserWatchlist(userId) {
  const { data, error } = await supabase
    .from('user_watch_lists')
    .select('anime_id, status')
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to fetch watchlist:', error.message)
    return []
  }

  // Sort by status priority so watching shows at the top
  const priority = { watching: 0, 'plan to watch': 1, completed: 2, dropped: 3 }
  return (data ?? []).sort(
    (a, b) => (priority[a.status] ?? 99) - (priority[b.status] ?? 99)
  )
}

/**
 * Fetch a user's personal anime rankings from `profile_anime_ranks`.
 * Returns an array of { anime_id, rating } sorted by rating descending.
 */
export async function getUserAnimeRanks(userId) {
  const { data, error } = await supabase
    .from('profile_anime_ranks')
    .select('anime_id, rating')
    .eq('user_id', userId)
    .order('rating', { ascending: false })

  if (error) {
    console.error('Failed to fetch anime ranks:', error.message)
    return []
  }
  return data ?? []
}

/**
 * Upsert a personal rating for an anime. Used from the profile page's
 * edit controls.
 */
export async function upsertAnimeRank(userId, animeId, rating) {
  const { error } = await supabase
    .from('profile_anime_ranks')
    .upsert(
      { user_id: userId, anime_id: animeId, rating },
      { onConflict: 'user_id,anime_id' }
    )

  if (error) throw error
}

/**
 * Combines watchlist rows + rank rows into one map keyed by anime_id, so
 * the profile page can merge each anime's status and rating together in
 * a single pass: { [animeId]: { status, rating } }.
 */
export function mergeWatchlistAndRanks(watchlist, ranks) {
  const merged = new Map()

  for (const { anime_id, status } of watchlist) {
    merged.set(anime_id, { status, rating: null })
  }
  for (const { anime_id, rating } of ranks) {
    const existing = merged.get(anime_id) ?? { status: null, rating: null }
    merged.set(anime_id, { ...existing, rating })
  }

  return merged
}