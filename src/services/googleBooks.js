// Google Books API — dados públicos de catálogo (sinopse, capa, autor).
// Uma API Key é opcional pra buscas simples, mas recomendada pra evitar limite
// de cota baixo. Crie em https://console.cloud.google.com > Credenciais
// (ative a "Books API" antes) e cole abaixo.
const API_KEY = ""; // opcional — deixe vazio pra testar sem chave

export async function searchBooks(query, maxResults = 5) {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
    langRestrict: "pt",
  });
  if (API_KEY) params.append("key", API_KEY);

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
  if (!res.ok) throw new Error(`Erro ao buscar livros (${res.status})`);

  const data = await res.json();
  return (data.items || []).map((item) => ({
    id: item.id,
    title: item.volumeInfo?.title || "(sem título)",
    author: (item.volumeInfo?.authors || []).join(", ") || "Autor desconhecido",
    thumbnail: item.volumeInfo?.imageLinks?.thumbnail || null,
    // O anjel só mostra sinopse/metadados públicos — nunca reproduz o texto do livro (spec 3.8).
    description: item.volumeInfo?.description || null,
  }));
}

// Sugestão automática com base nos interesses cadastrados no onboarding
// (ex.: "agronegócio", "gestão"). Usa o primeiro resultado relevante.
export async function suggestBookForInterest(interest) {
  const results = await searchBooks(interest, 3);
  return results[0] || null;
}
