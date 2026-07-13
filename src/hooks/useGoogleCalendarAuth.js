import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  GOOGLE_OAUTH, saveCalendarToken, clearCalendarToken, isCalendarConnected,
} from "../services/googleCalendar";

WebBrowser.maybeCompleteAuthSession();

// Uso:
//   const { connected, connecting, signIn, signOut } = useGoogleCalendarAuth();
//   <Button onPress={signIn} title="Conectar Google Calendar" />
export function useGoogleCalendarAuth() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: GOOGLE_OAUTH.expoClientId,
    androidClientId: GOOGLE_OAUTH.androidClientId,
    iosClientId: GOOGLE_OAUTH.iosClientId,
    scopes: GOOGLE_OAUTH.scopes,
  });

  useEffect(() => {
    isCalendarConnected().then(setConnected);
  }, []);

  useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        const { authentication } = response;
        await saveCalendarToken({
          accessToken: authentication.accessToken,
          refreshToken: authentication.refreshToken ?? null,
          expiresAt: authentication.expiresIn
            ? Date.now() + authentication.expiresIn * 1000
            : null,
        });
        setConnected(true);
        setConnecting(false);
      } else if (response?.type === "error" || response?.type === "dismiss") {
        setConnecting(false);
      }
    })();
  }, [response]);

  const signIn = async () => {
    setConnecting(true);
    await promptAsync();
  };

  const signOut = async () => {
    await clearCalendarToken();
    setConnected(false);
  };

  return { connected, connecting, signIn, signOut, requestReady: !!request };
}
