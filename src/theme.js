// Brand tokens for the anjel app — keep in sync with the spec document
export const colors = {
  ink: "#16213E",       // primary text / headers
  inkSoft: "#3C4A6B",   // secondary text
  brass: "#B4854A",     // primary accent
  brassSoft: "#E8D9C4",
  mist: "#EEF1F6",      // app background
  card: "#FFFFFF",
  sage: "#6E8F72",      // wellbeing / confirm green
  alert: "#C0554A",
  line: "#E1E5EE",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: "600", color: colors.ink },
  h2: { fontSize: 15, fontWeight: "700", color: colors.brass, textTransform: "uppercase", letterSpacing: 0.4 },
  body: { fontSize: 14, color: colors.ink },
  caption: { fontSize: 12, color: colors.inkSoft },
};
