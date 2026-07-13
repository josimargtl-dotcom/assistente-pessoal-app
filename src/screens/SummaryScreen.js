import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, radius } from "../theme";
import HorizonMark from "../components/HorizonMark";
import { getMeals, getInterests } from "../storage/preferences";
import { isCalendarConnected, fetchTodayEvents } from "../services/googleCalendar";
import { nearbyLeisure } from "../services/places";

function TimelineItem({ time, icon, title, tag, last }) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ alignItems: "center" }}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={14} color={colors.ink} />
        </View>
        {!last && <View style={{ width: 1, flex: 1, backgroundColor: colors.line, marginVertical: 4 }} />}
      </View>
      <View style={{ paddingBottom: 20, marginLeft: 12, flex: 1 }}>
        <Text style={{ fontSize: 11.5, fontWeight: "700", color: colors.brass }}>{time}</Text>
        <Text style={{ fontSize: 14, fontWeight: "500", color: colors.ink }}>{title}</Text>
        {tag ? <Text style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 2 }}>{tag}</Text> : null}
      </View>
    </View>
  );
}

function formatTime(iso) {
  if (!iso || iso.length === 10) return "Dia todo"; // data sem hora (all-day event)
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// Junta refeições cadastradas (locais) + eventos reais do Google Calendar
// (quando conectado) numa única timeline ordenada por horário.
function buildTimeline(meals, events) {
  const items = [];

  if (meals?.cafe) items.push({ time: meals.cafe, icon: "restaurant-outline", title: "Café da manhã" });
  if (meals?.almoco) items.push({ time: meals.almoco, icon: "restaurant-outline", title: "Almoço" });
  if (meals?.jantar) items.push({ time: meals.jantar, icon: "restaurant-outline", title: "Jantar" });

  events.forEach((ev) => {
    items.push({ time: formatTime(ev.start), icon: "calendar-outline", title: ev.title, tag: "Da sua agenda" });
  });

  return items.sort((a, b) => a.time.localeCompare(b.time));
}

export default function SummaryScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [leisure, setLeisure] = useState([]);
  const [leisureError, setLeisureError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meals = await getMeals();
      const hasCalendar = await isCalendarConnected();
      setConnected(hasCalendar);

      let events = [];
      if (hasCalendar) {
        events = await fetchTodayEvents();
      }
      setTimeline(buildTimeline(meals, events));
    } catch (e) {
      setError(e.message || "Não deu pra carregar sua agenda agora.");
    } finally {
      setLoading(false);
    }

    // Lazer perto de você — pede localização só aqui, na hora de usar (spec 3.7: opcional e granular).
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLeisureError("Permita localização pra ver sugestões de lazer perto de você.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const interests = await getInterests();
      const places = await nearbyLeisure({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        interests,
      });
      setLeisure(places);
      setLeisureError(null);
    } catch (e) {
      setLeisureError(e.message || "Não deu pra buscar sugestões de lazer agora.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.mist }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <HorizonMark />
      <Text style={{ fontSize: 12, color: colors.inkSoft, marginBottom: 2 }}>
        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
      </Text>
      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, marginBottom: 12 }}>Resumo do seu dia</Text>

      {!connected && (
        <View style={styles.hintCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.brass} />
          <Text style={{ fontSize: 12.5, color: colors.ink, marginLeft: 8, flex: 1 }}>
            Conecte o Google Calendar em Ajustes pra ver suas reuniões de verdade aqui.
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.brass} style={{ marginTop: 20 }} />
      ) : error ? (
        <Text style={{ fontSize: 13, color: colors.alert, marginBottom: 16 }}>{error}</Text>
      ) : (
        <View style={styles.card}>
          {timeline.length === 0 ? (
            <Text style={{ fontSize: 13, color: colors.inkSoft }}>Nada cadastrado ainda pra hoje.</Text>
          ) : (
            timeline.map((item, i) => (
              <TimelineItem key={i} {...item} last={i === timeline.length - 1} />
            ))
          )}
        </View>
      )}

      <Text style={styles.sectionLabel}>Lazer perto de você</Text>
      {leisureError ? (
        <Text style={{ fontSize: 12.5, color: colors.inkSoft }}>{leisureError}</Text>
      ) : leisure.length === 0 ? (
        <ActivityIndicator color={colors.brass} />
      ) : (
        leisure.map((p) => (
          <View key={p.id} style={styles.infoCard}>
            <View style={styles.iconBox}>
              <Ionicons name="location" size={17} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.ink }} numberOfLines={1}>{p.name}</Text>
              <Text style={{ fontSize: 11.5, color: colors.inkSoft }} numberOfLines={1}>
                {p.address}{p.rating ? ` · ★ ${p.rating}` : ""}{p.openNow === true ? " · aberto agora" : ""}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, marginBottom: 24 },
  hintCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#F6F0E6", borderWidth: 1, borderColor: colors.brassSoft, borderRadius: radius.md, padding: 12, marginBottom: 16 },
  iconCircle: { width: 32, height: 32, borderRadius: 999, backgroundColor: colors.brassSoft, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.brass, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  infoCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.brassSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
});
