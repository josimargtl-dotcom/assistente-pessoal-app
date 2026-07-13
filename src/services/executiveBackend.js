import { BACKEND_URL } from "../config";

// ---- Viagens (Amadeus via backend) ----------------------------------------
export async function searchFlights({ origin, destination, date }) {
  const params = new URLSearchParams({ origin, destination, date });
  const res = await fetch(`${BACKEND_URL}/flights?${params.toString()}`);
  if (!res.ok) throw new Error("Não consegui buscar voos agora.");
  const data = await res.json();
  return data.offers;
}

// ---- Recados de telefone (Twilio via backend) ------------------------------
export async function listVoicemails() {
  const res = await fetch(`${BACKEND_URL}/voicemails`);
  if (!res.ok) throw new Error("Não consegui buscar os recados agora.");
  const data = await res.json();
  return data.voicemails;
}
