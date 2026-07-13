import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function isNearMealTime(eventDate, mealTimeStr) {
  if (!mealTimeStr) return false;
  const [h, m] = mealTimeStr.split(":").map(Number);
  const mealDate = new Date(eventDate);
  mealDate.setHours(h, m, 0, 0);
  const diffMin = Math.abs((eventDate - mealDate) / 60000);
  return diffMin <= 60;
}

export async function scheduleProactiveAlerts(events, meals) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const granted = await requestNotificationPermission();
  if (!granted) return { scheduled: 0, reason: "sem_permissao" };

  const now = new Date();
  let scheduled = 0;

  for (const ev of events) {
    if (ev.allDay) continue;
    const startDate = new Date(ev.start);
    const alertDate = new Date(startDate.getTime() - 30 * 60000);
    if (alertDate <= now) continue;

    let body = ev.title + " começa em 30 minutos.";
    if (isNearMealTime(startDate, meals?.almoco)) {
      body += " Você ainda não registrou o almoço hoje — talvez seja hora.";
    }

    await Notifications.scheduleNotificationAsync({
      content: { title: "Assistente Pessoal", body },
      trigger: alertDate,
    });
    scheduled += 1;
  }

  return { scheduled, reason: null };
}
