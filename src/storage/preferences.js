import AsyncStorage from "@react-native-async-storage/async-storage";

// All keys the app stores locally. Kept in one place so "Excluir meus dados"
// (LGPD - direito ao esquecimento) can reliably wipe everything.
const KEYS = {
  ONBOARDING_DONE: "anjel:onboardingDone",
  PERMISSIONS: "anjel:permissions",
  MEALS: "anjel:meals",
  ACTIVITIES: "anjel:activities",
  INTERESTS: "anjel:interests",
  CONSENT_LOG: "anjel:consentLog",
  BOOKS: "anjel:books",
  TASKS: "anjel:tasks",
  HABITS: "anjel:habits",
};

const DEFAULT_PERMISSIONS = {
  agenda: false,
  notif: false,
  loc: false,
  mood: false,
  music: false,
};

const DEFAULT_MEALS = { cafe: "07:30", almoco: "12:00", jantar: "19:30" };

export async function getPermissions() {
  const raw = await AsyncStorage.getItem(KEYS.PERMISSIONS);
  return raw ? JSON.parse(raw) : DEFAULT_PERMISSIONS;
}

export async function setPermissions(perms) {
  await AsyncStorage.setItem(KEYS.PERMISSIONS, JSON.stringify(perms));
  // Auditoria: registra data/hora de cada mudança de consentimento (LGPD 5.2)
  const log = await getConsentLog();
  log.push({ perms, at: new Date().toISOString() });
  await AsyncStorage.setItem(KEYS.CONSENT_LOG, JSON.stringify(log));
}

export async function getConsentLog() {
  const raw = await AsyncStorage.getItem(KEYS.CONSENT_LOG);
  return raw ? JSON.parse(raw) : [];
}

export async function getMeals() {
  const raw = await AsyncStorage.getItem(KEYS.MEALS);
  return raw ? JSON.parse(raw) : DEFAULT_MEALS;
}

export async function setMeals(meals) {
  await AsyncStorage.setItem(KEYS.MEALS, JSON.stringify(meals));
}

export async function getActivities() {
  const raw = await AsyncStorage.getItem(KEYS.ACTIVITIES);
  return raw ? JSON.parse(raw) : [];
}

export async function setActivities(list) {
  await AsyncStorage.setItem(KEYS.ACTIVITIES, JSON.stringify(list));
}

export async function getInterests() {
  const raw = await AsyncStorage.getItem(KEYS.INTERESTS);
  return raw ? JSON.parse(raw) : [];
}

export async function setInterests(list) {
  await AsyncStorage.setItem(KEYS.INTERESTS, JSON.stringify(list));
}

// Livros: [{ id, title, author, thumbnail, pct, current }]
export async function getBooks() {
  const raw = await AsyncStorage.getItem(KEYS.BOOKS);
  return raw ? JSON.parse(raw) : [];
}

export async function setBooks(books) {
  await AsyncStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
}


// Tarefas: [{ id, title, priority: "alta"|"media"|"baixa", done, dueTime }]
export async function getTasks() {
  const raw = await AsyncStorage.getItem(KEYS.TASKS);
  return raw ? JSON.parse(raw) : [];
}

export async function setTasks(tasks) {
  await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
}


// Hábitos: [{ id, name, icon, streak, lastCheckedDate }]
const DEFAULT_HABITS = [
  { id: "agua", name: "Beber água", icon: "water-outline", streak: 0, lastCheckedDate: null },
  { id: "treino", name: "Treino", icon: "barbell-outline", streak: 0, lastCheckedDate: null },
  { id: "sono", name: "Dormir bem", icon: "moon-outline", streak: 0, lastCheckedDate: null },
  { id: "remedio", name: "Remédio", icon: "medkit-outline", streak: 0, lastCheckedDate: null },
];

export async function getHabits() {
  const raw = await AsyncStorage.getItem(KEYS.HABITS);
  return raw ? JSON.parse(raw) : DEFAULT_HABITS;
}

export async function setHabits(habits) {
  await AsyncStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
}

export async function isOnboardingDone() {
  const raw = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  return raw === "true";
}

export async function setOnboardingDone() {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, "true");
}

// LGPD — direito ao esquecimento: apaga todos os dados locais do usuário.
// Em produção, deve também disparar a exclusão no backend/servidor.
export async function eraseAllUserData() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
