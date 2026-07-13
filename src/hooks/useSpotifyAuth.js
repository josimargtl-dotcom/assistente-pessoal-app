import { useEffect, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { SPOTIFY_OAUTH, saveSpotifyToken, clearSpotifyToken, isSpotifyConnected } from "../services/spotify";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({ scheme: "assistentepessoal", path: "redirect" });

// Uso:
//   const { connected, connecting, signIn, signOut } = useSpotifyAuth();
export function useSpotifyAuth() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: SPOTIFY_OAUTH.clientId,
      scopes: SPOTIFY_OAUTH.scopes,
      usePKCE: true,
      redirectUri,
    },
    SPOTIFY_OAUTH.discovery
  );

  useEffect(() => {
    isSpotifyConnected().then(setConnected);
  }, []);

  useEffect(() => {
    (async () => {
      if (response?.type !== "success" || !request) return;
      try {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: SPOTIFY_OAUTH.clientId,
            code: response.params.code,
            redirectUri,
            extraParams: { code_verifier: request.codeVerifier },
          },
          SPOTIFY_OAUTH.discovery
        );
        await saveSpotifyToken({
          accessToken: tokenResult.accessToken,
          refreshToken: tokenResult.refreshToken ?? null,
          expiresAt: tokenResult.expiresIn ? Date.now() + tokenResult.expiresIn * 1000 : null,
        });
        setConnected(true);
      } finally {
        setConnecting(false);
      }
    })();
  }, [response, request]);

  const signIn = async () => {
    setConnecting(true);
    const result = await promptAsync();
    if (result.type !== "success") setConnecting(false);
  };

  const signOut = async () => {
    await clearSpotifyToken();
    setConnected(false);
  };

  return { connected, connecting, signIn, signOut };
}
