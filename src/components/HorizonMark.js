import React from "react";
import { View } from "react-native";
import { colors } from "../theme";

// Simple 3-tone bar standing in for the brand's horizon gradient
// (brass -> warm gold -> ink). Swap for a real gradient lib (expo-linear-gradient)
// once native builds are set up.
export default function HorizonMark() {
  return (
    <View style={{ flexDirection: "row", width: 40, height: 3, borderRadius: 999, overflow: "hidden", marginBottom: 12 }}>
      <View style={{ flex: 1, backgroundColor: colors.brass }} />
      <View style={{ flex: 1, backgroundColor: "#D8B27C" }} />
      <View style={{ flex: 1, backgroundColor: colors.ink }} />
    </View>
  );
}
