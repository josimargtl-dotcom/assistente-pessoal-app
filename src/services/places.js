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

// Categorias do Guia da Cidade
export const CITY_GUIDE_CATEGORIES = [
  { key: "restaurant", label: "Restaurantes", icon: "restaurant-outline" },
  { key: "park", label: "Parques", icon: "leaf-outline" },
  { key: "lodging", label: "Hospedagem", icon: "bed-outline" },
  { key: "tourist_attraction", label: "Pontos turísticos", icon: "camera-outline" },
  { key: "night_club", label: "Vida noturna", icon: "wine-outline" },
  { key: "supermarket", label: "Mercados", icon: "cart-outline" },
  { key: "bakery", label: "Padarias", icon: "storefront-outline" },
];

function mapPlacesResults(results) {
  return (results || []).slice(0, 12).map((p) => ({
    id: p.place_id,
    name: p.name,
    address: p.vicinity || p.formatted_address,
    rating: p.rating,
    priceLevel: p.price_level,
    openNow: p.opening_hours?.open_now ?? null,
  }));
}

// Busca por categoria perto de uma coordenada (usado quando já se sabe lat/lng).
export async function searchNearbyByCategory({ latitude, longitude, category, radius = 5000 }) {
  const params = new URLSearchParams({
    location: `${latitude},${longitude}`,
    radius: String(radius),
    type: category,
    key: API_KEY,
  });

  const res = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`);
  if (!res.ok) throw new Error(`Erro ao buscar lugares (${res.status})`);

  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Places API: ${data.status}`);
  }

  return mapPlacesResults(data.results);
}

// Busca uma cidade por nome (autocomplete simplificado) e retorna lat/lng.
export async function geocodeCity(cityName) {
  const params = new URLSearchParams({ address: cityName, key: API_KEY });
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  if (!res.ok) throw new Error(`Erro ao buscar cidade (${res.status})`);

  const data = await res.json();
  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error("Cidade não encontrada");
  }

  const loc = data.results[0].geometry.location;
  return {
    latitude: loc.lat,
    longitude: loc.lng,
    formattedName: data.results[0].formatted_address,
  };
}
