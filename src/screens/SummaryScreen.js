import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, radius } from "../theme";
import HorizonMark from "../components/HorizonMark";
import { getMeals, getInterests, getTasks, setTasks, getHabits } from "../storage/preferences";
import { TextInput, Pressable } from "react-native";
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


const PRIORITY_COLORS = { alta: "#C0392B", media: "#B8860B", baixa: "#4A7A4A" };
const PRIORITY_LABELS = { alta: "Alta", media: "Média", baixa: "Baixa" };

function TaskItem({ task, onToggle }) {
  return (
    <Pressable
      onPress={() => onToggle(task.id)}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}
    >
      <Ionicons
        name={task.done ? "checkbox" : "square-outline"}
        size={20}
        color={task.done ? colors.brass : colors.inkSoft}
      />
      <Text
        style={{
          flex: 1,
          marginLeft: 10,
          fontSize: 14,
          color: task.done ? colors.inkSoft : colors.ink,
          textDecorationLine: task.done ? "line-through" : "none",
        }}
      >
        {task.title}
      </Text>
      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: PRIORITY_COLORS[task.priority] + "22" }}>
        <Text style={{ fontSize: 10, fontWeight: "700", color: PRIORITY_COLORS[task.priority] }}>
          {PRIORITY_LABELS[task.priority]}
        </Text>
      </View>
    </Pressable>
  );
}


function getGreetingCard(timeline, tasks, habits) {
  const hour = new Date().getHours();
  const pendingTasks = tasks.filter((t) => !t.done).length;
  const doneTasks = tasks.filter((t) => t.done).length;
  const habitsToday = habits.filter((h) => h.lastCheckedDate === new Date().toISOString().slice(0, 10)).length;

  if (hour >= 5 && hour < 12) {
    return {
      title: "Bom dia! ☀️",
      message: `Você tem ${timeline.length} compromisso${timeline.length !== 1 ? "s" : ""} e ${pendingTasks} tarefa${pendingTasks !== 1 ? "s" : ""} pendente${pendingTasks !== 1 ? "s" : ""} hoje. Bora começar?`,
    };
  }
  if (hour >= 12 && hour < 18) {
    return {
      title: "Boa tarde",
      message: pendingTasks > 0
        ? `Ainda restam ${pendingTasks} tarefa${pendingTasks !== 1 ? "s" : ""} pra hoje.`
        : "Você já deu conta de tudo que tinha planejado. 🎉",
    };
  }
  return {
    title: "Resumo do seu dia",
    message: `Você completou ${doneTasks} tarefa${doneTasks !== 1 ? "s" : ""} e manteve ${habitsToday} hábito${habitsToday !== 1 ? "s" : ""} em dia hoje.`,
  };
}

export default function SummaryScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [leisure, setLeisure] = useState([]);
  const [leisureError, setLeisureError] = useState(null);
  const [tasks, setTasksState] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("media");
  const [habits, setHabitsState] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meals = await getMeals();
      const storedHabits = await getHabits();
      setHabitsState(storedHabits);
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

  const loadTasks = useCallback(async () => {
    const stored = await getTasks();
    setTasksState(stored);
  }, []);

  const toggleTask = async (id) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasksState(updated);
    await setTasks(updated);
  };

  const addTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const updated = [
      ...tasks,
      { id: Date.now().toString(), title, priority: newTaskPriority, done: false },
    ];
    setTasksState(updated);
    await setTasks(updated);
    setNewTaskTitle("");
  };

  const priorityRank = { alta: 0, media: 1, baixa: 2 };
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return priorityRank[a.priority] - priorityRank[b.priority];
  });

  useFocusEffect(
    useCallback(() => {
      load();
      loadTasks();
    }, [load, loadTasks])
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.mist }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <HorizonMark />
      <Text style={{ fontSize: 12, color: colors.inkSoft, marginBottom: 2 }}>
        {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
      </Text>
      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, marginBottom: 12 }}>Resumo do seu dia</Text>

      {(() => {
        const greeting = getGreetingCard(timeline, tasks, habits);
        return (
          <View style={{ backgroundColor: colors.ink, borderRadius: radius.lg, padding: 18, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 }}>{greeting.title}</Text>
            <Text style={{ fontSize: 13, color: "#E8E4DC" }}>{greeting.message}</Text>
          </View>
        );
      })()}


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


      <Text style={styles.sectionLabel}>Suas tarefas</Text>
      <View style={styles.card}>
        {sortedTasks.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 12 }}>Nenhuma tarefa ainda. Adicione uma abaixo.</Text>
        ) : (
          sortedTasks.map((task) => <TaskItem key={task.id} task={task} onToggle={toggleTask} />)
        )}

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
          <TextInput
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Nova tarefa..."
            placeholderTextColor={colors.inkSoft}
            style={{ flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: colors.ink }}
            onSubmitEditing={addTask}
          />
          <Pressable onPress={addTask} style={{ backgroundColor: colors.brass, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 9 }}>
            <Ionicons name="add" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
          {["alta", "media", "baixa"].map((p) => (
            <Pressable
              key={p}
              onPress={() => setNewTaskPriority(p)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: newTaskPriority === p ? PRIORITY_COLORS[p] : "transparent",
                borderWidth: 1,
                borderColor: PRIORITY_COLORS[p],
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "600", color: newTaskPriority === p ? "#fff" : PRIORITY_COLORS[p] }}>
                {PRIORITY_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

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
