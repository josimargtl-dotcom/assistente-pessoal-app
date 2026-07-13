import { BACKEND_URL } from "../config";

// messages: [{ role: "user" | "assistant", content: "texto" }, ...]
export async function sendChatMessage(messages) {
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    throw new Error("O anjel não conseguiu responder agora. Tenta de novo em instantes.");
  }

  const data = await res.json();
  return data.reply;
}
