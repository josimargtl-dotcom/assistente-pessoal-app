import { useEffect, useState } from "react";
import { Platform } from "react-native";

// WhatsApp e alguns outros apps de mensagem comuns — o filtro fica aqui no
// JS, não no nativo, pra ficar fácil de ajustar sem mexer em Kotlin.
const RELEVANT_PACKAGES = {
  "com.whatsapp": "WhatsApp",
  "com.google.android.gm": "Gmail",
  "com.google.android.apps.messaging": "Mensagens",
};

// No Android sem o módulo nativo compilado (ex.: Expo Go), isso simplesmente
// não faz nada — a tela deve tratar isPermissionGranted() como false.
let NotificationListener = null;
if (Platform.OS === "android") {
  try {
    // eslint-disable-next-line global-require
    NotificationListener = require("notification-listener");
  } catch (e) {
    // módulo nativo ainda não compilado neste build — ok, cai no fallback.
  }
}

export function useNotificationBridge() {
  const [available] = useState(!!NotificationListener);
  const [granted, setGranted] = useState(false);
  const [recent, setRecent] = useState([]); // últimas notificações relevantes recebidas

  useEffect(() => {
    if (!NotificationListener) return;
    setGranted(NotificationListener.isPermissionGranted());

    const sub = NotificationListener.addNotificationListener((event) => {
      const appLabel = RELEVANT_PACKAGES[event.packageName];
      if (!appLabel) return; // ignora apps fora da lista relevante
      setRecent((prev) => [
        { id: Date.now().toString(), app: appLabel, title: event.title, text: event.text },
        ...prev,
      ].slice(0, 10));
    });

    return () => sub.remove();
  }, []);

  const requestAccess = () => {
    if (!NotificationListener) return;
    NotificationListener.openSettings();
  };

  return { available, granted, recent, requestAccess };
}
