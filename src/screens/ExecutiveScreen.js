import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "../theme";
import HorizonMark from "../components/HorizonMark";
import { isCalendarConnected } from "../services/googleCalendar";
import { listRecentEmails } from "../services/gmail";
import { getHabits, setHabits, getBills, setBills, getFinanceGoal, setFinanceGoal } from "../storage/preferences";
import { TextInput } from "react-native";
import { listVoicemails, searchFlights } from "../services/executiveBackend";


function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function HabitRow({ habit, onCheck }) {
  const checkedToday = habit.lastCheckedDate === todayStr();
  return (
    <View style={styles.rowCard}>
      <Ionicons name={habit.icon} size={16} color={colors.inkSoft} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "500", color: colors.ink }}>{habit.name}</Text>
        <Text style={{ fontSize: 11.5, color: colors.inkSoft }}>
          {habit.streak > 0 ? `${habit.streak} dia${habit.streak > 1 ? "s" : ""} seguidos` : "Comece hoje"}
        </Text>
      </View>
      <Pressable onPress={() => onCheck(habit.id)} disabled={checkedToday}>
        <Ionicons
          name={checkedToday ? "checkmark-circle" : "checkmark-circle-outline"}
          size={26}
          color={checkedToday ? colors.brass : colors.inkSoft}
        />
      </Pressable>
    </View>
  );
}


function BillRow({ bill, onTogglePaid }) {
  const daysLeft = Math.ceil((new Date(bill.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isLate = daysLeft < 0 && !bill.paid;
  return (
    <Pressable onPress={() => onTogglePaid(bill.id)} style={styles.rowCard}>
      <Ionicons
        name={bill.paid ? "checkmark-circle" : isLate ? "alert-circle-outline" : "wallet-outline"}
        size={16}
        color={bill.paid ? colors.brass : isLate ? colors.alert : colors.inkSoft}
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "500", color: colors.ink, textDecorationLine: bill.paid ? "line-through" : "none" }}>
          {bill.name}
        </Text>
        <Text style={{ fontSize: 11.5, color: isLate ? colors.alert : colors.inkSoft }}>
          {bill.paid ? "Pago" : isLate ? `Atrasado ${Math.abs(daysLeft)} dia${Math.abs(daysLeft) !== 1 ? "s" : ""}` : `Vence em ${daysLeft} dia${daysLeft !== 1 ? "s" : ""}`}
          {" · R$ " + bill.amount.toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );
}

// Projeção simples de meta: quantos meses faltam no ritmo atual de aporte.
function projectGoal(goal) {
  if (!goal || !goal.monthlyContribution || goal.monthlyContribution <= 0) return null;
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) return { monthsLeft: 0, doneAlready: true };
  const monthsLeft = Math.ceil(remaining / goal.monthlyContribution);
  const years = Math.floor(monthsLeft / 12);
  const months = monthsLeft % 12;
  return { monthsLeft, years, months, doneAlready: false };
}

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function EmailRow({ subject, from, tag, level }) {
  const tagColor = level === "high" ? colors.alert : colors.sage;
  return (
    <View style={styles.rowCard}>
      <Ionicons name="mail-outline" size={15} color={colors.inkSoft} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, marginLeft: 10, marginRight: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "500", color: colors.ink }} numberOfLines={1}>{subject}</Text>
        <Text style={{ fontSize: 11.5, color: colors.inkSoft }} numberOfLines={1}>{from}</Text>
      </View>
      <View style={{ backgroundColor: tagColor + "22", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
        <Text style={{ fontSize: 10.5, fontWeight: "700", color: tagColor }}>{tag}</Text>
      </View>
    </View>
  );
}

// NOTE: exemplo de rota/data fixos pra ilustrar a busca de voos. Numa versão
// completa, esses campos viriam de um formulário preenchido pelo usuário.
const EXAMPLE_TRIP = { origin: "CGR", destination: "GYN", date: "2026-07-22" };

export default function ExecutiveScreen() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [emails, setEmails] = useState([]);
  const [emailError, setEmailError] = useState(null);
  const [voicemails, setVoicemails] = useState([]);
  const [voicemailError, setVoicemailError] = useState(null);
  const [flights, setFlights] = useState(null);
  const [flightState, setFlightState] = useState("idle"); // idle | loading | done | error
  const [habits, setHabitsState] = useState([]);
  const [bills, setBillsState] = useState([]);
  const [goal, setGoalState] = useState(null);
  const [goalInputs, setGoalInputs] = useState({ target: "", current: "", monthly: "" });

  const loadHabits = useCallback(async () => {
    setHabitsState(await getHabits());
  }, []);

  const loadFinance = useCallback(async () => {
    setBillsState(await getBills());
    const storedGoal = await getFinanceGoal();
    setGoalState(storedGoal);
    if (storedGoal) {
      setGoalInputs({
        target: String(storedGoal.targetAmount),
        current: String(storedGoal.currentAmount),
        monthly: String(storedGoal.monthlyContribution),
      });
    }
  }, []);

  const toggleBillPaid = async (id) => {
    const updated = bills.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b));
    setBillsState(updated);
    await setBills(updated);
  };

  const saveGoal = async () => {
    const target = parseFloat(goalInputs.target.replace(",", "."));
    const current = parseFloat(goalInputs.current.replace(",", ".")) || 0;
    const monthly = parseFloat(goalInputs.monthly.replace(",", ".")) || 0;
    if (!target || target <= 0) return;
    const newGoal = { targetAmount: target, currentAmount: current, monthlyContribution: monthly };
    setGoalState(newGoal);
    await setFinanceGoal(newGoal);
  };

  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  const checkHabit = async (id) => {
    const today = todayStr();
    const yesterday = yesterdayStr();
    const updated = habits.map((h) => {
      if (h.id !== id || h.lastCheckedDate === today) return h;
      const continuing = h.lastCheckedDate === yesterday;
      return { ...h, streak: continuing ? h.streak + 1 : 1, lastCheckedDate: today };
    });
    setHabitsState(updated);
    await setHabits(updated);
  };

  const load = useCallback(async () => {
    const connected = await isCalendarConnected();
    setGoogleConnected(connected);

    if (connected) {
      try {
        setEmails(await listRecentEmails(5));
        setEmailError(null);
      } catch (e) {
        setEmailError(e.message);
      }
    }

    try {
      setVoicemails(await listVoicemails());
      setVoicemailError(null);
    } catch (e) {
      setVoicemailError(e.message);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); loadHabits(); loadFinance(); }, [load, loadHabits, loadFinance]));

  const runFlightSearch = async () => {
    setFlightState("loading");
    try {
      setFlights(await searchFlights(EXAMPLE_TRIP));
      setFlightState("done");
    } catch (e) {
      setFlightState("error");
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.mist }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <HorizonMark />
      <Text style={{ fontSize: 24, fontWeight: "700", color: colors.ink, marginBottom: 4 }}>Modo Executivo</Text>
      <Text style={{ fontSize: 13, color: colors.inkSoft, marginBottom: 18 }}>
        Triagem de comunicação, viagem e pagamentos — nada é enviado ou reservado sem sua confirmação.
      </Text>

      <SectionLabel>E-mails não lidos</SectionLabel>
      {!googleConnected ? (
        <Text style={styles.hint}>Conecte sua conta Google em Ajustes pra ver a triagem de e-mail aqui.</Text>
      ) : emailError ? (
        <Text style={{ fontSize: 12.5, color: colors.alert, marginBottom: 16 }}>{emailError}</Text>
      ) : emails.length === 0 ? (
        <ActivityIndicator color={colors.brass} style={{ marginBottom: 16 }} />
      ) : (
        emails.map((e) => <EmailRow key={e.id} {...e} />)
      )}


      <SectionLabel>Hábitos do dia</SectionLabel>
      {habits.map((h) => (
        <HabitRow key={h.id} habit={h} onCheck={checkHabit} />
      ))}

      <SectionLabel>Recados por telefone</SectionLabel>
      {voicemailError ? (
        <Text style={{ fontSize: 12.5, color: colors.inkSoft, marginBottom: 16 }}>
          Configure o backend de telefonia (Twilio) pra ver recados aqui.
        </Text>
      ) : voicemails.length === 0 ? (
        <Text style={styles.hint}>Nenhum recado ainda.</Text>
      ) : (
        voicemails.map((v) => (
          <View key={v.id} style={styles.rowCard}>
            <Ionicons name="call-outline" size={15} color={colors.inkSoft} style={{ marginTop: 2 }} />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "500", color: colors.ink }}>{v.from}</Text>
              <Text style={{ fontSize: 11.5, color: colors.inkSoft }}>
                {v.transcript || "Transcrevendo..."} · {new Date(v.receivedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>
        ))
      )}

      <SectionLabel>Viagem em organização</SectionLabel>
      <View style={styles.tripCard}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <Ionicons name="airplane-outline" size={16} color={colors.ink} />
          <Text style={{ fontSize: 13.5, fontWeight: "600", color: colors.ink, marginLeft: 8 }}>
            {EXAMPLE_TRIP.origin} → {EXAMPLE_TRIP.destination}
          </Text>
        </View>
        <Text style={{ fontSize: 12, color: colors.inkSoft, marginBottom: 12 }}>{EXAMPLE_TRIP.date}</Text>

        {flightState === "idle" && (
          <Pressable style={styles.primaryButton} onPress={runFlightSearch}>
            <Text style={{ color: "#fff", fontSize: 13.5, fontWeight: "600" }}>Buscar voos</Text>
          </Pressable>
        )}
        {flightState === "loading" && <ActivityIndicator color={colors.brass} />}
        {flightState === "error" && (
          <Text style={{ fontSize: 12.5, color: colors.alert }}>
            Configure o backend de viagens (Amadeus) pra buscar voos de verdade.
          </Text>
        )}
        {flightState === "done" && flights?.length > 0 && (
          <>
            {flights.map((f) => (
              <View key={f.id} style={styles.flightRow}>
                <Text style={{ fontSize: 12.5, color: colors.ink }}>
                  {f.segments?.[0]?.carrier} · {f.segments?.[0]?.from} → {f.segments?.[f.segments.length - 1]?.to}
                </Text>
                <Text style={{ fontSize: 12.5, fontWeight: "700", color: colors.brass }}>
                  {f.currency} {f.price}
                </Text>
              </View>
            ))}
            <Pressable style={[styles.primaryButton, { marginTop: 8 }]}>
              <Text style={{ color: "#fff", fontSize: 13.5, fontWeight: "600" }}>Revisar e confirmar reserva</Text>
            </Pressable>
          </>
        )}
      </View>

      <SectionLabel>Contas a vencer</SectionLabel>
      {bills.length === 0 ? (
        <Text style={styles.hint}>Nenhuma conta cadastrada ainda.</Text>
      ) : (
        bills.map((b) => <BillRow key={b.id} bill={b} onTogglePaid={toggleBillPaid} />)
      )}

      <SectionLabel>Meta financeira</SectionLabel>
      <View style={styles.tripCard}>
        {goal && projectGoal(goal) && !projectGoal(goal).doneAlready && (
          <Text style={{ fontSize: 13, color: colors.ink, marginBottom: 12 }}>
            No ritmo atual, você bate R$ {goal.targetAmount.toLocaleString("pt-BR")} em{" "}
            {projectGoal(goal).years > 0 ? `${projectGoal(goal).years} ano${projectGoal(goal).years > 1 ? "s" : ""}${projectGoal(goal).months > 0 ? ` e ${projectGoal(goal).months} mes${projectGoal(goal).months > 1 ? "es" : ""}` : ""}` : `${projectGoal(goal).months} mes${projectGoal(goal).months > 1 ? "es" : ""}`}.
          </Text>
        )}
        {goal && projectGoal(goal)?.doneAlready && (
          <Text style={{ fontSize: 13, color: colors.brass, fontWeight: "600", marginBottom: 12 }}>Meta já alcançada! 🎉</Text>
        )}
        <TextInput
          value={goalInputs.target}
          onChangeText={(v) => setGoalInputs((s) => ({ ...s, target: v }))}
          placeholder="Meta (ex: 1000000)"
          placeholderTextColor={colors.inkSoft}
          keyboardType="numeric"
          style={styles.financeInput}
        />
        <TextInput
          value={goalInputs.current}
          onChangeText={(v) => setGoalInputs((s) => ({ ...s, current: v }))}
          placeholder="Valor atual"
          placeholderTextColor={colors.inkSoft}
          keyboardType="numeric"
          style={styles.financeInput}
        />
        <TextInput
          value={goalInputs.monthly}
          onChangeText={(v) => setGoalInputs((s) => ({ ...s, monthly: v }))}
          placeholder="Aporte mensal"
          placeholderTextColor={colors.inkSoft}
          keyboardType="numeric"
          style={styles.financeInput}
        />
        <Pressable style={styles.primaryButton} onPress={saveGoal}>
          <Text style={{ color: "#fff", fontSize: 13.5, fontWeight: "600" }}>Salvar meta</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 12, fontWeight: "700", color: colors.brass, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8, marginTop: 4 },
  hint: { fontSize: 12.5, color: colors.inkSoft, marginBottom: 16 },
  rowCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 12, marginBottom: 10 },
  tripCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16, marginBottom: 24 },
  primaryButton: { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: 11, alignItems: "center" },
  flightRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line },
  financeInput: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: colors.ink, marginBottom: 8 },
});
