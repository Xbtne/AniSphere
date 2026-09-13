// AniList GraphQL API client
const ANILIST_URL = 'https://graphql.anilist.co';

const cache = new Map();

async function queryAniList(query, variables = {}, cacheTimeMs = 5 * 60 * 1000) {
  const cacheKey = JSON.stringify({ query, variables });
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTimeMs) {
    return cached.data;
  }

  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`AniList API responded with status ${response.status}`);
    }

    const json = await response.json();
    if (json.errors) {
      console.error('AniList GraphQL Errors:', json.errors);
      throw new Error(json.errors[0]?.message || 'GraphQL query error');
    }

    cache.set(cacheKey, { timestamp: Date.now(), data: json.data });
    return json.data;
  } catch (error) {
    console.error('Fetch error from AniList:', error);
    throw error;
  }
}

// Base fields without characters
const BASE_ANIME_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  coverImage {
    extraLarge
    large
    medium
    color
  }
  bannerImage
  format
  status
  episodes
  duration
  season
  seasonYear
  averageScore
  meanScore
  popularity
  favourites
  genres
  description
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
  trailer {
    id
    site
    thumbnail
  }
  studios(isMain: true) {
    nodes {
      name
    }
  }
`;

// Media Fragment for list & card views (includes 3 voice actors for Dub detection)
const ANIME_FIELDS = `
  ${BASE_ANIME_FIELDS}
  characters(sort: ROLE, perPage: 3) {
    edges {
      voiceActors {
        id
        languageV2
      }
    }
  }
`;

// 1. Get Trending Anime
export async function getTrendingAnime(page = 1, perPage = 15) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { page, perPage });
  return data.Page.media;
}

// 2. Get Seasonal Anime (ALL THE NEW ANIME AIRING NOW)
export async function getSeasonalAnime(page = 1, perPage = 24) {
  // Determine current season
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let season = 'WINTER';
  if (month >= 3 && month <= 5) season = 'SPRING';
  else if (month >= 6 && month <= 8) season = 'SUMMER';
  else if (month >= 9 && month <= 11) season = 'FALL';

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          currentPage
        }
        media(type: ANIME, season: $season, seasonYear: $seasonYear, status: RELEASING, sort: POPULARITY_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  try {
    const data = await queryAniList(query, { page, perPage, season, seasonYear: year });
    // If season returns few due to year edge cases, fallback to current RELEASING
    if (!data.Page.media || data.Page.media.length < 5) {
      return getAiringNow(page, perPage);
    }
    return data.Page.media;
  } catch (e) {
    return getAiringNow(page, perPage);
  }
}

// Fallback for Airing Now
export async function getAiringNow(page = 1, perPage = 24) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: RELEASING, sort: TRENDING_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { page, perPage });
  return data.Page.media;
}

// 3. Get Upcoming Anime
export async function getUpcomingAnime(page = 1, perPage = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { page, perPage });
  return data.Page.media;
}

// 4. Get Top Rated Anime
export async function getTopRatedAnime(page = 1, perPage = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { page, perPage });
  return data.Page.media;
}

// 5. Get Popular Anime of All Time
export async function getPopularAllTime(page = 1, perPage = 20) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { page, perPage });
  return data.Page.media;
}

// 6. Search & Filter Anime across the HUGE library
export async function searchAnime({
  search = '',
  genre = null,
  sort = 'POPULARITY_DESC',
  status = null,
  format = null,
  seasonYear = null,
  season = null,
  page = 1,
  perPage = 48,
}) {
  const variables = { page, perPage };
  
  // Sort mapping
  if (sort === 'TITLE_ASC') {
    variables.sort = ['TITLE_ROMAJI'];
  } else if (sort === 'TITLE_DESC') {
    variables.sort = ['TITLE_ROMAJI_DESC'];
  } else {
    variables.sort = [sort];
  }

  if (search && search.trim()) variables.search = search.trim();
  if (genre && genre !== 'All') variables.genre = genre;
  if (status && status !== 'All') variables.status = status;
  if (format && format !== 'All') variables.format = format;
  if (seasonYear && seasonYear !== 'All') variables.seasonYear = parseInt(seasonYear, 10);
  if (season && season !== 'All') variables.season = season;

  const query = `
    query ($page: Int, $perPage: Int, $search: String, $genre: String, $sort: [MediaSort], $status: MediaStatus, $format: MediaFormat, $seasonYear: Int, $season: MediaSeason) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          total
          hasNextPage
          currentPage
          lastPage
        }
        media(type: ANIME, search: $search, genre: $genre, sort: $sort, status: $status, format: $format, seasonYear: $seasonYear, season: $season, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;

  const data = await queryAniList(query, variables);
  return data.Page;
}

// 7. Get Random Anime (Surprise Me)
export async function getRandomAnime() {
  const randomPage = Math.floor(Math.random() * 50) + 1;
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 1) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await queryAniList(query, { page: randomPage });
  return data.Page.media[0];
}

// 7. Get Full Detailed Anime (for Watch Modal)
export async function getAnimeDetails(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${BASE_ANIME_FIELDS}
        source
        countryOfOrigin
        startDate {
          year
          month
          day
        }
        endDate {
          year
          month
          day
        }
        externalLinks {
          id
          site
          url
          type
          icon
          color
        }
        streamingEpisodes {
          title
          thumbnail
          url
          site
        }
        characters(sort: ROLE, perPage: 8) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                medium
              }
            }
            voiceActors {
              id
              name {
                full
              }
              image {
                medium
              }
              languageV2
            }
          }
        }
        recommendations(perPage: 6, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              ${ANIME_FIELDS}
            }
          }
        }
      }
    }
  `;

  const data = await queryAniList(query, { id });
  return data.Media;
}

export function hasEnglishDub(anime) {
  if (!anime) return false;
  if (anime.characters?.edges) {
    return anime.characters.edges.some((edge) =>
      edge.voiceActors?.some((va) => va?.languageV2 === 'English')
    );
  }
  return false;
}

export const POPULAR_GENRES = [
  'All',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller'
];

export const POPULAR_YEARS = [
  'All',
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
  '2021',
  '2020',
  '2019',
  '2018',
  '2017',
  '2016',
  '2015',
  '2014',
  '2012',
  '2010',
  '2005',
  '2000',
  '1995',
  '1990'
];

export const ALPHABET_LETTERS = [
  'All',
  '#',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

