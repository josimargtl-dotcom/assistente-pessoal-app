import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme";

export default function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? colors.brass : colors.line,
          backgroundColor: selected ? colors.brassSoft : "transparent",
        },
      ]}
    >
      <Text style={{ fontSize: 13, fontWeight: selected ? "600" : "500", color: selected ? colors.ink : colors.inkSoft }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
});
