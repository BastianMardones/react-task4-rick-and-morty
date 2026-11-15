import { API_BASE_URL } from '../config/constants';

export async function getCharacters({ page = 1, name = '' } = {}) {
  const trimmedName = name.trim();
  const query = trimmedName
    ? `page=${encodeURIComponent(page)}&name=${encodeURIComponent(trimmedName)}`
    : `page=${encodeURIComponent(page)}`;
  const url = `${API_BASE_URL}/character?${query}`;

  const response = await fetch(url);

  if (response.status === 404) {
    return { results: [], hasNextPage: false };
  }

  if (!response.ok) {
    throw new Error(`No se pudieron cargar los personajes (HTTP ${response.status}).`);
  }

  const data = await response.json();
  return {
    results: Array.isArray(data.results) ? data.results : [],
    hasNextPage: Boolean(data.info?.next),
  };
}
