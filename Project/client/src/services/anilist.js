const ANILIST_API = 'https://graphql.anilist.co'

export async function anilistRequest(query, variables = {}) {
  const response = await fetch(ANILIST_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables
    })
  })

  const data = await response.json()

  if (data.errors) {
    throw new Error(data.errors[0].message)
  }

  return data.data
}

// Fields needed for the card (cover/title/rating) + modal (genres, summary,
// studio, etc) in one query, so opening the modal doesn't need a second request.
const ANIME_FIELDS = `
  id
  title {
    romaji
    english
  }
  coverImage {
    large
    color
  }
  bannerImage
  averageScore
  episodes
  status
  season
  seasonYear
  genres
  description(asHtml: false)
  studios(isMain: true) {
    nodes {
      name
    }
  }
`

const SEARCH_ANIME_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
        ${ANIME_FIELDS}
      }
    }
  }
`

const ANIME_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      ${ANIME_FIELDS}
    }
  }
`

// Fetches up to 50 anime in a single request using AniList's id_in filter.
// Used by the profile page to load watchlist + top-rated anime details
// without making one request per anime.
const ANIME_BY_IDS_QUERY = `
  query ($ids: [Int], $perPage: Int) {
    Page(perPage: $perPage) {
      media(id_in: $ids, type: ANIME) {
        ${ANIME_FIELDS}
      }
    }
  }
`

// Sorted by AniList's average user score, not popularity — this is what
// powers the homepage's "top rated" carousel. Supports pagination so the
// carousel can fetch more anime as the user scrolls further right.
const TOP_RATED_ANIME_QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(type: ANIME, sort: SCORE_DESC) {
        ${ANIME_FIELDS}
      }
    }
  }
`

// Sorted by AniList's real-time trending score — this powers the hero
// slideshow at the top of the homepage.
const TRENDING_ANIME_QUERY = `
  query ($perPage: Int) {
    Page(perPage: $perPage) {
      media(type: ANIME, sort: TRENDING_DESC) {
        ${ANIME_FIELDS}
      }
    }
  }
`

// Filtered to a specific season/year and NOT_YET_RELEASED status, sorted
// chronologically by start date rather than popularity or score — this
// powers the "upcoming" carousel for the next anime season.
const UPCOMING_ANIME_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(
        type: ANIME
        season: $season
        seasonYear: $seasonYear
        status: NOT_YET_RELEASED
        sort: START_DATE
      ) {
        ${ANIME_FIELDS}
      }
    }
  }
`

// Filtered to a specific season/year and RELEASING status, sorted by
// popularity — this powers the "airing now" carousel for the current
// anime season.
const AIRING_ANIME_QUERY = `
  query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(
        type: ANIME
        season: $season
        seasonYear: $seasonYear
        status: RELEASING
        sort: POPULARITY_DESC
      ) {
        ${ANIME_FIELDS}
      }
    }
  }
`

// Flexible browse query for the "Anime" page: optional genre filter,
// configurable sort (popularity/score/trending), with pagination.
// genre is nullable — when omitted, AniList simply doesn't filter by it.
const BROWSE_ANIME_QUERY = `
  query ($genre: String, $sort: [MediaSort], $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        hasNextPage
      }
      media(type: ANIME, genre: $genre, sort: $sort) {
        ${ANIME_FIELDS}
      }
    }
  }
`

export async function searchAnime(search = '', perPage = 20) {
  const data = await anilistRequest(SEARCH_ANIME_QUERY, { search, perPage })
  return data.Page.media
}

export async function getTrendingAnime(perPage = 5) {
  const data = await anilistRequest(TRENDING_ANIME_QUERY, { perPage })
  return data.Page.media
}

// Figures out the next anime season (WINTER/SPRING/SUMMER/FALL) + year
// based on today's date, using AniList's actual quarterly boundaries:
// WINTER = Jan-Mar, SPRING = Apr-Jun, SUMMER = Jul-Sep, FALL = Oct-Dec.
// (Earlier version used Dec-Feb/Mar-May/etc, a month off from how AniList
// actually tags seasons — confirmed by checking AniChart's live airing
// calendar, where Spring 2026 was still showing as currently-airing in
// mid-June.)
export function getNextSeason(date = new Date()) {
  const month = date.getMonth() + 1 // 1-12
  const year = date.getFullYear()

  const seasons = [
    { name: 'WINTER', months: [1, 2, 3] },
    { name: 'SPRING', months: [4, 5, 6] },
    { name: 'SUMMER', months: [7, 8, 9] },
    { name: 'FALL', months: [10, 11, 12] },
  ]

  const currentIndex = seasons.findIndex((s) => s.months.includes(month))
  const nextIndex = (currentIndex + 1) % 4

  // Year only bumps when wrapping FALL -> WINTER
  const nextYear = currentIndex === 3 && nextIndex === 0 ? year + 1 : year

  return { season: seasons[nextIndex].name, seasonYear: nextYear }
}

// Figures out the CURRENT anime season (WINTER/SPRING/SUMMER/FALL) + year
// based on today's date — the season that's airing right now, as opposed
// to getNextSeason's upcoming one. Uses the same corrected boundaries as
// getNextSeason above.
export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth() + 1 // 1-12
  const year = date.getFullYear()

  const seasons = [
    { name: 'WINTER', months: [1, 2, 3] },
    { name: 'SPRING', months: [4, 5, 6] },
    { name: 'SUMMER', months: [7, 8, 9] },
    { name: 'FALL', months: [10, 11, 12] },
  ]

  const currentIndex = seasons.findIndex((s) => s.months.includes(month))

  return { season: seasons[currentIndex].name, seasonYear: year }
}

// Returns { media, hasNextPage } for the "airing now" carousel.
export async function getAiringAnime(page = 1, perPage = 8) {
  const { season, seasonYear } = getCurrentSeason()
  const data = await anilistRequest(AIRING_ANIME_QUERY, {
    season,
    seasonYear,
    page,
    perPage,
  })
  return {
    media: data.Page.media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    season,
    seasonYear,
  }
}

// Returns { media, hasNextPage } for the upcoming-season carousel.
export async function getUpcomingAnime(page = 1, perPage = 8) {
  const { season, seasonYear } = getNextSeason()
  const data = await anilistRequest(UPCOMING_ANIME_QUERY, {
    season,
    seasonYear,
    page,
    perPage,
  })
  return {
    media: data.Page.media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
    season,
    seasonYear,
  }
}

// Returns { media, hasNextPage } so the carousel knows whether to keep
// fetching more pages as the user scrolls right.
export async function getTopRatedAnime(page = 1, perPage = 8) {
  const data = await anilistRequest(TOP_RATED_ANIME_QUERY, { page, perPage })
  return {
    media: data.Page.media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  }
}

// AniList's standard genre list (a fixed set on their end) — hardcoded
// here since it doesn't change and querying it separately would just be
// an extra round trip for no benefit.
export const ANILIST_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy',
  'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological',
  'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
]

// AniList's sort enum values for the three modes the Anime page supports.
export const BROWSE_SORT_OPTIONS = {
  popularity: { label: 'Popularity', value: 'POPULARITY_DESC' },
  score: { label: 'Score', value: 'SCORE_DESC' },
  trending: { label: 'Trending', value: 'TRENDING_DESC' },
}

// Returns { media, hasNextPage } for the general "Anime" browse page.
// genre: one of ANILIST_GENRES, or null/undefined for no filter.
// sortKey: one of BROWSE_SORT_OPTIONS' keys ('popularity' | 'score' | 'trending').
export async function getBrowseAnime({ genre = null, sortKey = 'popularity', page = 1, perPage = 24 } = {}) {
  const sortValue = BROWSE_SORT_OPTIONS[sortKey]?.value ?? BROWSE_SORT_OPTIONS.popularity.value
  const data = await anilistRequest(BROWSE_ANIME_QUERY, {
    genre,
    sort: [sortValue],
    page,
    perPage,
  })
  return {
    media: data.Page.media,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  }
}

export async function getAnimeById(id) {
  const data = await anilistRequest(ANIME_BY_ID_QUERY, { id })
  return data.Media
}

// Batch-fetches up to 50 anime by id in one request. Returns a Map of
// id -> anime object so callers can look up by id in O(1).
export async function getAnimeByIds(ids) {
  if (!ids?.length) return new Map()
  // AniList caps Page at 50 — slice defensively
  const limited = ids.slice(0, 50)
  const data = await anilistRequest(ANIME_BY_IDS_QUERY, {
    ids: limited,
    perPage: limited.length,
  })
  const animeMap = new Map()
  for (const anime of data.Page.media) {
    animeMap.set(Number(anime.id), anime)
  }
  return animeMap
}

// Builds a URL-friendly slug like "frieren-beyond-journeys-end-154587" —
// readable title up front, AniList id suffixed on so the detail page can
// always resolve it back to a real anime even if two titles collide.
export function buildAnimeSlug(anime) {
  const title = anime.title?.english || anime.title?.romaji || 'anime'
  const slugTitle = title
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slugTitle}-${anime.id}`
}

// Pulls the AniList id back out of a slug built by buildAnimeSlug.
// Returns null if the slug doesn't end in a numeric id.
export function parseAnimeIdFromSlug(slug) {
  const match = slug.match(/-(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}