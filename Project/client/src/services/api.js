// Thin wrapper around the Express backend API.
// All watchlist and ranking mutations go through here rather than
// hitting Supabase directly, so your server-side validation runs.

const BASE_URL = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }

  return data
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function updateUserProfile(userId, fields) {
  return request(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  })
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function fetchUserWatchlist(userId) {
  try {
    return await request(`/user_watch_lists/${userId}`)
  } catch (err) {
    // 404 just means empty list — treat as []
    if (err.message.includes('No watch list')) return []
    throw err
  }
}

export async function upsertWatchlistEntry(userId, animeId, status) {
  return request('/user_watch_lists', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, anime_id: animeId, status }),
  })
}

export async function updateWatchlistStatus(userId, animeId, status) {
  return request('/user_watch_lists', {
    method: 'PATCH',
    body: JSON.stringify({ user_id: userId, anime_id: animeId, status }),
  })
}

export async function deleteWatchlistEntry(userId, animeId) {
  return request('/user_watch_lists', {
    method: 'DELETE',
    body: JSON.stringify({ user_id: userId, anime_id: animeId }),
  })
}

// ─── Profile anime rankings ───────────────────────────────────────────────────

export async function fetchUserAnimeRanks(userId) {
  try {
    return await request(`/profile_anime_ranks/${userId}`)
  } catch (err) {
    if (err.message.includes('No anime ranks')) return []
    throw err
  }
}

export async function upsertAnimeRank(userId, animeId, rating) {
  return request('/profile_anime_ranks', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, anime_id: animeId, rating }),
  })
}

export async function updateAnimeRank(userId, animeId, rating) {
  return request('/profile_anime_ranks', {
    method: 'PATCH',
    body: JSON.stringify({ user_id: userId, anime_id: animeId, rating }),
  })
}

// Persists a new drag-and-drop order for the user's top-rated list.
// order is an array of anime_id in the desired display order (first = top).
export async function reorderAnimeRanks(userId, order) {
  return request('/profile_anime_ranks/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ user_id: userId, order }),
  })
}

export async function deleteAnimeRank(userId, animeId) {
  return request('/profile_anime_ranks', {
    method: 'DELETE',
    body: JSON.stringify({ user_id: userId, anime_id: animeId }),
  })
}