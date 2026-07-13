// Google Places API — usada aqui pra "o que tem perto de você" (parques,
// museus, casas de show etc). Restrinja essa chave no Google Cloud Console
// por assinatura do app Android (SHA-1 + package name) antes de publicar —
// diferente da Calendar/Gmail, essa chave *pode* ir no app porque a Places
// API é feita pra uso client-side, desde que restrita dessa forma.
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

// Mapa simples de interesses (cadastrados no onboarding) -> tipos de lugar do Google Places.
const INTEREST_TO_TYPE = {
  "Shows e música": "night_club",
  "Gastronomia": "restaurant",
  "Cultura e arte": "museum",
  "Ar livre": "park",
  "Esportes": "stadium",
  "Feiras": "market",
};

export async function nearbyLeisure({ latitude, longitude, interests = [] }) {
  const types = interests.map((i) => INTEREST_TO_TYPE[i]).filter(Boolean);
  const type = types[0] || "point_of_interest";

  const params = new URLSearchParams({
    location: `${latitude},${longitude}`,
    radius: "3000",
    type,
    key: API_KEY,
  });

  const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`);
  if (!res.ok) throw new Error(`Erro ao buscar lugares (${res.status})`);

  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Places API: ${data.status}`);
  }

  return (data.results || []).slice(0, 5).map((p) => ({
    id: p.place_id,
    name: p.name,
    address: p.vicinity,
    rating: p.rating,
    openNow: p.opening_hours?.open_now ?? null,
  }));
}
