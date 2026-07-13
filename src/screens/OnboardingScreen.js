import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import HorizonMark from "../components/HorizonMark";
import Toggle from "../components/Toggle";
import Chip from "../components/Chip";
import {
  getPermissions, setPermissions, getMeals, setMeals,
  getActivities, setActivities, getInterests, setInterests, setOnboardingDone,
} from "../storage/preferences";

const PERM_ITEMS = [
  { key: "agenda", icon: "calendar-outline", title: "Agenda", desc: "Ler e sugerir horários no seu calendário" },
  { key: "notif", icon: "notifications-outline", title: "Notificações", desc: "Avisar sobre mensagens e lembretes do celular" },
  { key: "loc", icon: "location-outline", title: "Localização", desc: "Sugerir eventos e lazer perto de você" },
  { key: "mood", icon: "heart-outline", title: "Humor e bem-estar", desc: "Perguntar como você está e oferecer apoio" },
  { key: "music", icon: "musical-notes-outline", title: "Músicas", desc: "Sugerir playlists no Spotify ou YouTube Music" },
];

const ACTIVITY_OPTIONS = ["Caminhada", "Corrida", "Academia", "Yoga", "Ciclismo", "Sem preferência"];
const INTEREST_OPTIONS = ["Shows e música", "Gastronomia", "Cultura e arte", "Ar livre", "Esportes", "Feiras"];

export default function OnboardingScreen({ onDone }) {
  const [perms, setPermsState] = useState({ agenda: false, notif: false, loc: false, mood: false, music: false });
  const [meals, setMealsState] = useState({ cafe: "07:30", almoco: "12:00", jantar: "19:30" });
  const [activities, setActivitiesState] = useState(["Caminhada"]);
  const [interests, setInterestsState] = useState(["Gastronomia"]);

  useEffect(() => {
    (async () => {
      setPermsState(await getPermissions());
      setMealsState(await getMeals());
      setActivitiesState(await getActivities());
      setInterestsState(await getInterests());
    })();
  }, []);

  const togglePerm = (key) => setPermsState((p) => ({ ...p, [key]: !p[key] }));
  const toggleFrom = (list, setList, item) =>
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);

  const finish = async () => {
    await setPermissions(perms);
    await setMeals(meals);
    await setActivities(activities);
    await setInterests(interests);
    await setOnboardingDone();
    onDone();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.mist }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <HorizonMark />
      <Text style={{ fontSize: 26, fontWeight: "700", color: colors.ink, marginBottom: 4 }}>Oi, eu sou o seu Assistente Pessoal.</Text>
      <Text style={{ fontSize: 14, color: colors.inkSoft, marginBottom: 20 }}>
        Antes de começar, escolha o que eu posso acessar. Você pode mudar isso quando quiser.
      </Text>

      <Text style={styles.sectionLabel}>Permissões</Text>
      <View style={styles.card}>
        {PERM_ITEMS.map((it, i) => (
          <View key={it.key} style={[styles.permRow, i > 0 && styles.permRowBorder]}>
            <View style={styles.iconCircle}>
              <Ionicons name={it.icon} size={16} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.ink }}>{it.title}</Text>
              <Text style={{ fontSize: 12, color: colors.inkSoft }}>{it.desc}</Text>
            </View>
            <Toggle value={perms[it.key]} onChange={() => togglePerm(it.key)} />
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Horário das refeições</Text>
      <View style={[styles.card, { flexDirection: "row", padding: 16, justifyContent: "space-between" }]}>
        {[
          { key: "cafe", label: "Café" },
          { key: "almoco", label: "Almoço" },
          { key: "jantar", label: "Jantar" },
        ].map((m) => (
          <View key={m.key} style={{ flex: 1, marginRight: 8 }}>
            <Text style={{ fontSize: 11, color: colors.inkSoft, marginBottom: 4 }}>{m.label}</Text>
            <TextInput
              value={meals[m.key]}
              onChangeText={(v) => setMealsState((s) => ({ ...s, [m.key]: v }))}
              placeholder="HH:MM"
              style={styles.timeInput}
            />
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Quer praticar alguma atividade?</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20 }}>
        {ACTIVITY_OPTIONS.map((a) => (
          <Chip key={a} label={a} selected={activities.includes(a)} onPress={() => toggleFrom(activities, setActivitiesState, a)} />
        ))}
      </View>

      <Text style={styles.sectionLabel}>O que te interessa na cidade?</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 24 }}>
        {INTEREST_OPTIONS.map((a) => (
          <Chip key={a} label={a} selected={interests.includes(a)} onPress={() => toggleFrom(interests, setInterestsState, a)} />
        ))}
      </View>

      <Pressable onPress={finish} style={styles.primaryButton}>
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>Concluir configuração</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
      </Pressable>
      <Text style={{ fontSize: 11, color: colors.inkSoft, textAlign: "center", marginTop: 10 }}>
        Você pode revisar ou apagar seus dados a qualquer momento nas configurações.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.brass, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, marginBottom: 20, overflow: "hidden" },
  permRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  permRowBorder: { borderTopWidth: 1, borderTopColor: colors.line },
  iconCircle: { width: 36, height: 36, borderRadius: 999, backgroundColor: colors.brassSoft, alignItems: "center", justifyContent: "center", marginRight: 12 },
  timeInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, color: colors.ink },
  primaryButton: { flexDirection: "row", backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
});
