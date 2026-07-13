import * as SecureStore from "expo-secure-store";

// ---- Config -------------------------------------------------------------
// Preencha com os IDs criados no Google Cloud Console (ver README > "Google
// Calendar — passo a passo"). Cada plataforma usa um Client ID diferente.
export const GOOGLE_OAUTH = {
  expoClientId: "427336680294-9n715esc33jsma0t0nhre2f0icape61m.apps.googleusercontent.com",   // dev no Expo Go
  androidClientId: "427336680294-sd41hnvsvoq467ijr4h3lj0999o1henr.apps.googleusercontent.com",
  iosClientId: "SEU_IOS_CLIENT_ID.apps.googleusercontent.com",
  scopes: [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/gmail.readonly",
  ],
};

const TOKEN_KEY = "anjel:googleCalendarToken";

// ---- Token storage (SecureStore, não AsyncStorage — token é credencial) --
export async function saveCalendarToken(token) {
  await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(token));
}

export async function getCalendarToken() {
  const raw = await SecureStore.getItemAsync(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Revoga o acesso local — usado tanto em "desconectar agenda" quanto em
// "Excluir meus dados" (LGPD, direito ao esquecimento).
export async function clearCalendarToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function isCalendarConnected() {
  return (await getCalendarToken()) !== null;
}

// ---- Calendar API ---------------------------------------------------------
function startEndOfToday() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

// Busca os compromissos de hoje na agenda principal do usuário.
// Lança erro se o token expirou — quem chamar deve tratar reautenticação.
export async function fetchTodayEvents() {
  const token = await getCalendarToken();
  if (!token) throw new Error("Agenda não conectada");

  const { timeMin, timeMax } = startEndOfToday();
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token.accessToken}` } }
  );

  if (res.status === 401) {
    await clearCalendarToken();
    throw new Error("Sessão da agenda expirou — reconecte em Ajustes");
  }
  if (!res.ok) {
    throw new Error(`Erro ao buscar agenda (${res.status})`);
  }

  const data = await res.json();
  return (data.items || []).map((ev) => ({
    id: ev.id,
    title: ev.summary || "(sem título)",
    start: ev.start?.dateTime || ev.start?.date,
    end: ev.end?.dateTime || ev.end?.date,
    allDay: !ev.start?.dateTime,
  }));
}

// Cria um evento — sempre chamado só depois de confirmação explícita do
// usuário na UI (nunca de forma automática), conforme a spec.
export async function createEvent({ title, startISO, endISO }) {
  const token = await getCalendarToken();
  if (!token) throw new Error("Agenda não conectada");

  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: title,
        start: { dateTime: startISO },
        end: { dateTime: endISO },
      }),
    }
  );

  if (!res.ok) throw new Error(`Erro ao criar evento (${res.status})`);
  return res.json();
}
