import * as SecureStore from "expo-secure-store";

// ---- Config ---------------------------------------------------------------
// Crie o app em https://developer.spotify.com/dashboard (ver README > "Spotify
// — passo a passo"). Fluxo Authorization Code + PKCE: não precisa de client
// secret no app (seguro para mobile).
export const SPOTIFY_OAUTH = {
  clientId: "7ae635a0d89947288cd04e59a874f8f9",
  scopes: ["user-read-email"], // busca de playlists é dado público; não precisa de mais escopo
  discovery: {
    authorizationEndpoint: "https://accounts.spotify.com/authorize",
    tokenEndpoint: "https://accounts.spotify.com/api/token",
  },
};

const TOKEN_KEY = "anjel:spotifyToken";

export async function saveSpotifyToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(token));
}

export async function getSpotifyToken() {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSpotifyToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function isSpotifyConnected() {
  return (await getSpotifyToken()) !== null;
}

// ---- Mapeamento simples de tom -> busca de playlist -----------------------
// Em produção, o "tom" viria da análise de humor (módulo 3.2). Por ora,
// mapeamos algumas palavras-chave simples pra decidir a busca.
const MOOD_QUERIES = {
  triste: "playlist calma acolhedora",
  cansado: "playlist manhã tranquila",
  estressado: "playlist relaxante instrumental",
  animado: "playlist foco produtividade",
  energico: "playlist upbeat energia",
};

export function queryForMood(mood) {
  return MOOD_QUERIES[mood] || "playlist para o seu dia";
}

// Busca a primeira playlist pública que combina com o texto informado.
export async function searchPlaylist(query) {
  const token = await getSpotifyToken();
  if (!token) throw new Error("Spotify não conectado");

  const params = new URLSearchParams({ q: query, type: "playlist", limit: "1" });
  const res = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });

  if (res.status === 401) {
    await clearSpotifyToken();
    throw new Error("Sessão do Spotify expirou — reconecte em Ajustes");
  }
  if (!res.ok) throw new Error(`Erro ao buscar playlist (${res.status})`);

  const data = await res.json();
  const item = data.playlists?.items?.[0];
  if (!item) return null;

  return {
    id: item.id,
    name: item.name,
    imageUrl: item.images?.[0]?.url,
    externalUrl: item.external_urls?.spotify,
    uri: item.uri, // abre direto no app Spotify, se instalado
  };
}
