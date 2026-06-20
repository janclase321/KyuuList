import { supabase } from './supabaseClient.js'

// Matches the exact text values your user_watch_lists.status column uses.
export const WATCH_STATUS = {
  WATCHING: 'watching',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  PLAN_TO_WATCH: 'plan to watch',
}

/**
 * Returns the current watchlist row for this user + anime, or null if
 * the anime isn't on their list yet.
 */
export async function getWatchlistEntry(userId, animeId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('user_watch_lists')
    .select('user_id, anime_id, status')
    .eq('user_id', userId)
    .eq('anime_id', animeId)
    .maybeSingle() // returns null instead of throwing when no row exists

  if (error) {
    console.error('Failed to fetch watchlist entry:', error.message)
    return null
  }
  return data
}

/**
 * Adds an anime to the user's watchlist, or updates the status if it's
 * already on there. anime_id is AniList's numeric id.
 */
export async function upsertWatchlistEntry(userId, animeId, status = WATCH_STATUS.PLAN_TO_WATCH) {
  if (!userId) throw new Error('Must be logged in to update your watchlist.')

  const { data, error } = await supabase
    .from('user_watch_lists')
    .upsert(
      { user_id: userId, anime_id: animeId, status },
      { onConflict: 'user_id,anime_id' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Removes an anime from the user's watchlist entirely.
 */
export async function removeWatchlistEntry(userId, animeId) {
  if (!userId) throw new Error('Must be logged in to update your watchlist.')

  const { error } = await supabase
    .from('user_watch_lists')
    .delete()
    .eq('user_id', userId)
    .eq('anime_id', animeId)

  if (error) throw error
}