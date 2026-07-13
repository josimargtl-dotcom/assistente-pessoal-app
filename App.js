import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { colors } from "./src/theme";
import { isOnboardingDone } from "./src/storage/preferences";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import ChatScreen from "./src/screens/ChatScreen";
import SummaryScreen from "./src/screens/SummaryScreen";
import ReadingScreen from "./src/screens/ReadingScreen";
import ExecutiveScreen from "./src/screens/ExecutiveScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import CityGuideScreen from "./src/screens/CityGuideScreen";

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Conversa: "chatbubble-outline",
  Resumo: "today-outline",
  Leitura: "book-outline",
  Executivo: "briefcase-outline",
  Ajustes: "settings-outline",
  Guia: "compass-outline",
};

function MainTabs({ onDataErased }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brass,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Conversa" component={ChatScreen} />
      <Tab.Screen name="Resumo" component={SummaryScreen} />
      <Tab.Screen name="Leitura" component={ReadingScreen} />
      <Tab.Screen name="Executivo" component={ExecutiveScreen} />
      <Tab.Screen name="Guia" component={CityGuideScreen} />
      <Tab.Screen name="Ajustes">
        {() => <SettingsScreen onDataErased={onDataErased} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  const checkOnboarding = async () => {
    setOnboarded(await isOnboardingDone());
    setLoading(false);
  };

  useEffect(() => {
    checkOnboarding();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.mist }}>
        <ActivityIndicator color={colors.brass} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {onboarded ? (
        <MainTabs onDataErased={() => setOnboarded(false)} />
      ) : (
        <OnboardingScreen onDone={() => setOnboarded(true)} />
      )}
    </NavigationContainer>
  );
}
