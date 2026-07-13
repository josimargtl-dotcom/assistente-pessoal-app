import React, { useRef, useState } from "react";
import {
  View, Text, ScrollView, TextInput, Pressable, ActivityIndicator,
  Linking, KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import { sendChatMessage } from "../services/anjelChat";
import { isSpotifyConnected, searchPlaylist, queryForMood } from "../services/spotify";

const MOOD_KEYWORDS = {
  triste: "triste",
  cansad: "cansado",
  estress: "estressado",
  anim: "animado",
  energ: "energico",
};

function detectMood(text) {
  const lower = text.toLowerCase();
  for (const [needle, mood] of Object.entries(MOOD_KEYWORDS)) {
    if (lower.includes(needle)) return mood;
  }
  return null;
}

function Bubble({ from, children }) {
  const mine = from === "user";
  return (
    <View style={{ flexDirection: "row", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <View
        style={{
          maxWidth: "78%",
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 18,
          backgroundColor: mine ? colors.ink : colors.card,
          borderWidth: mine ? 0 : 1,
          borderColor: colors.line,
          borderBottomRightRadius: mine ? 4 : 18,
          borderBottomLeftRadius: mine ? 18 : 4,
        }}
      >
        <Text style={{ fontSize: 13.5, color: mine ? "#fff" : colors.ink }}>{children}</Text>
      </View>
    </View>
  );
}

// Card que aparece quando a última mensagem sugere um tom emocional —
// oferece playlist, mas só busca quando a pessoa toca (nunca automático).
function MusicPrompt({ mood }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error | disconnected
  const [track, setTrack] = useState(null);

  const handlePress = async () => {
    setState("loading");
    const connected = await isSpotifyConnected();
    if (!connected) {
      setState("disconnected");
      return;
    }
    try {
      const result = await searchPlaylist(queryForMood(mood));
      setTrack(result);
      setState("done");
    } catch (e) {
      setState("error");
    }
  };

  const openTrack = () => {
    if (!track) return;
    Linking.openURL(track.uri).catch(() => Linking.openURL(track.externalUrl));
  };

  return (
    <View style={styles.musicCard}>
      <View style={styles.iconBox}>
        <Ionicons name="musical-notes" size={17} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        {state === "idle" && (
          <Pressable onPress={handlePress}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}>Quer uma playlist pra isso?</Text>
            <Text style={{ fontSize: 11.5, color: colors.brass }}>Toque pra ver uma sugestão</Text>
          </Pressable>
        )}
        {state === "loading" && <ActivityIndicator color={colors.brass} style={{ alignSelf: "flex-start" }} />}
        {state === "done" && track && (
          <Pressable onPress={openTrack}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink }}>{track.name}</Text>
            <Text style={{ fontSize: 11.5, color: colors.inkSoft }}>Playlist · Spotify · toque pra abrir</Text>
          </Pressable>
        )}
        {state === "disconnected" && (
          <Text style={{ fontSize: 12, color: colors.inkSoft }}>Conecte o Spotify em Ajustes pra receber sugestões.</Text>
        )}
        {state === "error" && (
          <Text style={{ fontSize: 12, color: colors.alert }}>Não consegui buscar agora. Tenta de novo.</Text>
        )}
      </View>
    </View>
  );
}

const INITIAL_MESSAGES = [
  { id: "seed-1", role: "assistant", content: "Bom dia! Como você está hoje?" },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;

    const userMsg = { id: Date.now() + "-u", role: "user", content: text };
    const mood = detectMood(text);
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);

    try {
      // A API espera só role/content — filtra os cards de música da conversa enviada.
      const history = nextMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map(({ role, content }) => ({ role, content }));

      const reply = await sendChatMessage(history);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + "-a", role: "assistant", content: reply },
        ...(mood ? [{ id: Date.now() + "-m", role: "music-prompt", mood }] : []),
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + "-err", role: "assistant", content: "Não consegui responder agora — verifica sua conexão e tenta de novo." },
      ]);
    } finally {
      setSending(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.mist }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={14} color="#fff" />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.ink }}>Assistente Pessoal</Text>
          <Text style={{ fontSize: 11, color: colors.sage }}>ativo agora</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) =>
          m.role === "music-prompt" ? (
            <MusicPrompt key={m.id} mood={m.mood} />
          ) : (
            <Bubble key={m.id} from={m.role}>{m.content}</Bubble>
          )
        )}
        {sending && <ActivityIndicator color={colors.brass} style={{ marginTop: 4 }} />}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escrever para o Assistente Pessoal..."
          style={styles.input}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={styles.sendButton} onPress={send} disabled={sending}>
          <Ionicons name="send" size={15} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  avatar: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.brass, alignItems: "center", justifyContent: "center", marginRight: 10 },
  musicCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.brassSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, fontSize: 13.5, color: colors.ink },
  sendButton: { width: 36, height: 36, borderRadius: 999, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
});
