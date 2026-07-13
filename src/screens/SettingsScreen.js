import React from "react";
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import { eraseAllUserData } from "../storage/preferences";
import { BACKEND_URL } from "../config";
import { clearCalendarToken } from "../services/googleCalendar";
import { clearSpotifyToken } from "../services/spotify";
import { useGoogleCalendarAuth } from "../hooks/useGoogleCalendarAuth";
import { useSpotifyAuth } from "../hooks/useSpotifyAuth";
import { useNotificationBridge } from "../hooks/useNotificationBridge";

export default function SettingsScreen({ onDataErased }) {
  const calendar = useGoogleCalendarAuth();
  const spotify = useSpotifyAuth();
  const notifications = useNotificationBridge();

  const confirmErase = () => {
    Alert.alert(
      "Excluir meus dados",
      "Isso apaga permanentemente suas permissões, preferências e histórico salvos neste aparelho. Não pode ser desfeito.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir tudo",
          style: "destructive",
          onPress: async () => {
            await eraseAllUserData();
            await clearCalendarToken();
            await clearSpotifyToken();
            try {
              await fetch(`${BACKEND_URL}/voicemails`, { method: "DELETE" });
            } catch (e) {
              // Falha de rede não deve travar a exclusão local — os dados locais já foram apagados.
            }
            onDataErased();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.mist }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, marginBottom: 18 }}>Configurações</Text>

      <Text style={styles.sectionLabel}>Integrações</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="calendar-outline" size={17} color={colors.ink} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 14, color: colors.ink }}>Google Calendar</Text>
            <Text style={{ fontSize: 11.5, color: colors.inkSoft }}>
              {calendar.connected ? "Conectado — usado no Resumo do dia" : "Não conectado"}
            </Text>
          </View>
          {calendar.connecting ? (
            <ActivityIndicator color={colors.brass} />
          ) : (
            <Pressable onPress={calendar.connected ? calendar.signOut : calendar.signIn}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: calendar.connected ? colors.alert : colors.brass }}>
                {calendar.connected ? "Desconectar" : "Conectar"}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.row, styles.rowBorder]}>
          <Ionicons name="musical-notes-outline" size={17} color={colors.ink} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 14, color: colors.ink }}>Spotify</Text>
            <Text style={{ fontSize: 11.5, color: colors.inkSoft }}>
              {spotify.connected ? "Conectado — usado nas sugestões de música" : "Não conectado"}
            </Text>
          </View>
          {spotify.connecting ? (
            <ActivityIndicator color={colors.brass} />
          ) : (
            <Pressable onPress={spotify.connected ? spotify.signOut : spotify.signIn}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: spotify.connected ? colors.alert : colors.brass }}>
                {spotify.connected ? "Desconectar" : "Conectar"}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.row, styles.rowBorder]}>
          <Ionicons name="notifications-outline" size={17} color={colors.ink} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ fontSize: 14, color: colors.ink }}>Notificações do celular</Text>
            <Text style={{ fontSize: 11.5, color: colors.inkSoft }}>
              {!notifications.available
                ? "Precisa de um build próprio (não funciona no Expo Go)"
                : notifications.granted
                ? "Ativado"
                : "Não ativado"}
            </Text>
          </View>
          {notifications.available && !notifications.granted && (
            <Pressable onPress={notifications.requestAccess}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.brass }}>Ativar</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>Privacidade</Text>
      <View style={styles.card}>
        <Pressable style={styles.row}>
          <Ionicons name="document-text-outline" size={17} color={colors.ink} />
          <Text style={styles.rowText}>Política de Privacidade</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
        </Pressable>
        <Pressable style={[styles.row, styles.rowBorder]}>
          <Ionicons name="options-outline" size={17} color={colors.ink} />
          <Text style={styles.rowText}>Revisar permissões</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.inkSoft} />
        </Pressable>
      </View>

      <Pressable onPress={confirmErase} style={styles.dangerButton}>
        <Ionicons name="trash-outline" size={16} color={colors.alert} />
        <Text style={{ color: colors.alert, fontSize: 14, fontWeight: "600", marginLeft: 8 }}>Excluir meus dados</Text>
      </Pressable>
      <Text style={{ fontSize: 11, color: colors.inkSoft, marginTop: 8 }}>
        Direito ao esquecimento (LGPD): apaga tudo o que o Assistente Pessoal guardou sobre você neste aparelho, incluindo as conexões com Google Calendar e Spotify.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.brass, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, marginBottom: 28, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  rowText: { flex: 1, fontSize: 14, color: colors.ink, marginLeft: 10 },
  dangerButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.alert, borderRadius: radius.lg, paddingVertical: 13 },
});
