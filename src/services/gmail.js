import { getCalendarToken, clearCalendarToken } from "./googleCalendar";

// Reaproveita o mesmo token do Google (Calendar + Gmail pedidos no mesmo
// consentimento — ver GOOGLE_OAUTH.scopes em googleCalendar.js).

const URGENT_WORDS = ["urgente", "hoje", "prazo", "importante", "imediato"];

function classify(subject, snippet) {
  const text = `${subject} ${snippet}`.toLowerCase();
  if (URGENT_WORDS.some((w) => text.includes(w))) return { tag: "Urgente", level: "high" };
  return { tag: "Sem urgência", level: "low" };
}

async function authedFetch(url) {
  const token = await getCalendarToken();
  if (!token) throw new Error("Google não conectado");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token.accessToken}` } });
  if (res.status === 401) {
    await clearCalendarToken();
    throw new Error("Sessão do Google expirou — reconecte em Ajustes");
  }
  if (!res.ok) throw new Error(`Erro ao buscar e-mails (${res.status})`);
  return res.json();
}

function headerValue(headers, name) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

// Lista os e-mails não lidos mais recentes, já classificados por urgência.
// Só leitura (gmail.readonly) — o anjel nunca envia nada sem confirmação (spec 4.3).
export async function listRecentEmails(maxResults = 5) {
  const list = await authedFetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=is:unread`
  );
  const ids = (list.messages || []).map((m) => m.id);

  const details = await Promise.all(
    ids.map((id) =>
      authedFetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`
      )
    )
  );

  return details.map((d) => {
    const subject = headerValue(d.payload?.headers, "Subject") || "(sem assunto)";
    const from = headerValue(d.payload?.headers, "From");
    const { tag, level } = classify(subject, d.snippet || "");
    return { id: d.id, subject, from, snippet: d.snippet, tag, level };
  });
}
