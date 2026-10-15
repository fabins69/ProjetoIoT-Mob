import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Sensor, SensorStatusValue } from "@/lib/iot/types";

export const COLORS = {
  background: "#071316",
  surface: "#0D1F23",
  raised: "#12292E",
  border: "#1D383E",
  text: "#E7F2EF",
  muted: "#8DA6A5",
  mint: "#67E8C4",
  green: "#58D68D",
  amber: "#F3B85B",
  red: "#F27878",
};

export function statusKind(status: SensorStatusValue | undefined): "active" | "inactive" | "unknown" {
  if (typeof status === "boolean") return status ? "active" : "inactive";
  if (typeof status === "number") return status > 0 ? "active" : "inactive";
  if (typeof status === "string") {
    const normalized = status.toLowerCase().trim();
    if (["1", "true", "ativo", "active", "online", "ligado", "on"].includes(normalized)) return "active";
    if (["0", "false", "inativo", "inactive", "offline", "desligado", "off"].includes(normalized)) return "inactive";
  }
  return "unknown";
}

export function statusLabel(status: SensorStatusValue | undefined) {
  const kind = statusKind(status);
  if (kind === "active") return "Ativo";
  if (kind === "inactive") return "Inativo";
  return typeof status === "string" && status ? status : "Sem status";
}

export function StatusPill({ status }: { status: SensorStatusValue | undefined }) {
  const kind = statusKind(status);
  const tone = kind === "active" ? COLORS.green : kind === "inactive" ? COLORS.amber : COLORS.muted;
  return (
    <View style={[styles.pill, { borderColor: `${tone}55`, backgroundColor: `${tone}14` }]}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[styles.pillText, { color: tone }]}>{statusLabel(status)}</Text>
    </View>
  );
}

export function SensorCard({ sensor, onPress }: { sensor: Sensor; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir sensor ${sensor.codigo}`}
      onPress={onPress}
      style={({ pressed }) => [styles.sensorCard, pressed && styles.pressed]}
    >
      <View style={styles.sensorIcon}>
        <Ionicons name="hardware-chip-outline" size={19} color={COLORS.mint} />
      </View>
      <View style={styles.sensorCopy}>
        <Text style={styles.sensorCode}>{sensor.codigo}</Text>
        <Text style={styles.sensorType} numberOfLines={1}>{sensor.tipo || sensor.descricao || "Sensor IoT"}</Text>
      </View>
      <StatusPill status={sensor.status} />
      <Ionicons name="chevron-forward" size={17} color={COLORS.muted} />
    </Pressable>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  accent = COLORS.mint,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${accent}17` }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  count,
}: {
  eyebrow?: string;
  title: string;
  count?: number;
}) {
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionHeading}>{title}</Text>
      </View>
      {count !== undefined ? <Text style={styles.count}>{String(count).padStart(2, "0")}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sensorCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  sensorIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#67E8C414",
  },
  sensorCopy: { flex: 1, minWidth: 70, gap: 4 },
  sensorCode: { color: COLORS.text, fontSize: 14, fontWeight: "700", letterSpacing: 0.6 },
  sensorType: { color: COLORS.muted, fontSize: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: "700" },
  metricCard: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 135,
    padding: 18,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: "space-between",
  },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricValue: { color: COLORS.text, fontSize: 30, fontWeight: "700", letterSpacing: -1 },
  metricLabel: { color: COLORS.muted, fontSize: 12, fontWeight: "600" },
  sectionTitle: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 10 },
  eyebrow: { color: COLORS.mint, fontSize: 10, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 6 },
  sectionHeading: { color: COLORS.text, fontSize: 19, fontWeight: "700", letterSpacing: -0.3 },
  count: { color: COLORS.muted, fontSize: 12, fontVariant: ["tabular-nums"], fontWeight: "700" },
});
