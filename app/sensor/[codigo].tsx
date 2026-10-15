import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StatusPill, COLORS, statusKind, statusLabel } from "@/components/iot/sensor-ui";
import { atualizarStatusSensor, visualizarSensor } from "@/lib/iot/api";
import type { Sensor } from "@/lib/iot/types";

export default function SensorDetailScreen() {
  const router = useRouter();
  const { codigo: routeCode } = useLocalSearchParams<{ codigo: string }>();
  const codigo = Array.isArray(routeCode) ? routeCode[0] : routeCode;
  const [sensor, setSensor] = useState<Sensor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!codigo) return;
    let current = true;
    visualizarSensor(codigo)
      .then((result) => { if (current) setSensor(result); })
      .catch((cause) => { if (current) setError(cause instanceof Error ? cause.message : "Não foi possível consultar o sensor."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [codigo]);

  const reload = useCallback(async () => {
    if (!codigo) return;
    setLoading(true);
    setError(null);
    setUpdateMessage(null);
    try {
      setSensor(await visualizarSensor(codigo));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível consultar o sensor.");
    } finally {
      setLoading(false);
    }
  }, [codigo]);

  const changeStatus = async (status: boolean) => {
    if (!codigo) return;
    setUpdatingStatus(true);
    setUpdateMessage(null);
    try {
      const result = await atualizarStatusSensor(codigo, status);
      setSensor((current) => current ? { ...current, status: result.status } : current);
      setUpdateMessage(result.message);
    } catch (cause) {
      setUpdateMessage(cause instanceof Error ? cause.message : "Não foi possível atualizar o status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentKind = statusKind(sensor?.status);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.topbar}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={18} color={COLORS.text} />
          </Pressable>
          <Text style={styles.topTitle}>Detalhe do sensor</Text>
          <Pressable onPress={() => void reload()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Atualizar status">
            <Ionicons name="refresh" size={17} color={COLORS.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.statePanel}><ActivityIndicator color={COLORS.mint} /><Text style={styles.muted}>Consultando {codigo}…</Text></View>
        ) : error ? (
          <View style={styles.statePanel}>
            <View style={styles.errorIcon}><Ionicons name="cloud-offline-outline" size={22} color={COLORS.red} /></View>
            <Text style={styles.title}>Sensor indisponível</Text>
            <Text style={styles.muted}>{error}</Text>
            <Pressable onPress={() => void reload()} style={styles.secondaryButton}><Text style={styles.secondaryText}>Tentar novamente</Text></Pressable>
          </View>
        ) : sensor ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}><Ionicons name="hardware-chip-outline" size={24} color={COLORS.mint} /></View>
              <Text style={styles.eyebrow}>IDENTIFICAÇÃO</Text>
              <Text style={styles.code}>{sensor.codigo}</Text>
              <Text style={styles.type}>{sensor.tipo || "Sensor IoT"}</Text>
              <View style={{ marginTop: 18 }}><StatusPill status={sensor.status} /></View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Informações do backend</Text>
              <InfoRow label="Código" value={sensor.codigo} mono />
              <InfoRow label="Tipo" value={sensor.tipo || "Não informado"} />
              <InfoRow label="Status" value={statusLabel(sensor.status)} />
              {sensor.descricao ? <InfoRow label="Descrição" value={sensor.descricao} /> : null}
              {sensor.ambiente ? <InfoRow label="Ambiente" value={sensor.ambiente} /> : null}
              {sensor.ambiente_id !== undefined ? <InfoRow label="ID do ambiente" value={String(sensor.ambiente_id)} mono /> : null}
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusHeading}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Controle de status</Text>
                  <Text style={styles.controlHint}>A alteração é enviada ao backend imediatamente.</Text>
                </View>
                <Ionicons name="toggle-outline" size={20} color={COLORS.mint} />
              </View>
              <View style={styles.statusActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={updatingStatus || currentKind === "active"}
                  onPress={() => void changeStatus(true)}
                  style={({ pressed }) => [styles.activateButton, (pressed || currentKind === "active") && styles.disabledButton]}
                >
                  {updatingStatus ? <ActivityIndicator size="small" color={COLORS.background} /> : <Text style={styles.activateText}>{currentKind === "active" ? "Sensor ativo" : "Ativar sensor"}</Text>}
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={updatingStatus || currentKind === "inactive"}
                  onPress={() => void changeStatus(false)}
                  style={({ pressed }) => [styles.deactivateButton, (pressed || currentKind === "inactive") && styles.disabledButton]}
                >
                  <Text style={styles.deactivateText}>{currentKind === "inactive" ? "Sensor inativo" : "Desativar"}</Text>
                </Pressable>
              </View>
              {updateMessage ? <Text style={[styles.updateMessage, updateMessage.toLowerCase().includes("atualiz") && { color: COLORS.green }]}>{updateMessage}</Text> : null}
            </View>

            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.mint} />
              <Text style={styles.note}>Esta tela exibe código, tipo e status retornados pela API. A documentação fornecida não mostra uma rota GET para consultar histórico de leituras.</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]} selectable>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  page: { flexGrow: 1, width: "100%", maxWidth: 900, alignSelf: "center", padding: 20, paddingBottom: 42 },
  topbar: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 25 },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.surface },
  topTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  statePanel: { minHeight: 260, alignItems: "center", justifyContent: "center", gap: 12, padding: 24, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18 },
  errorIcon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#F2787818" },
  title: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  muted: { maxWidth: 550, color: COLORS.muted, fontSize: 13, lineHeight: 20, textAlign: "center" },
  secondaryButton: { paddingHorizontal: 15, paddingVertical: 11, marginTop: 4, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10 },
  secondaryText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  heroCard: { alignItems: "center", padding: 26, marginBottom: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18 },
  heroIcon: { width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: "#67E8C414", marginBottom: 16 },
  eyebrow: { color: COLORS.mint, fontSize: 9, fontWeight: "800", letterSpacing: 2 },
  code: { color: COLORS.text, fontSize: 30, fontWeight: "800", letterSpacing: 0.6, marginTop: 7 },
  type: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  infoCard: { padding: 19, marginBottom: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginBottom: 6 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { color: COLORS.muted, fontSize: 12 },
  infoValue: { flex: 1, color: COLORS.text, fontSize: 12, fontWeight: "600", textAlign: "right" },
  mono: { fontVariant: ["tabular-nums"], letterSpacing: 0.4 },
  statusCard: { padding: 19, marginBottom: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18 },
  statusHeading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  controlHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  statusActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  activateButton: { minHeight: 42, minWidth: 140, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, borderRadius: 10, backgroundColor: COLORS.mint },
  activateText: { color: COLORS.background, fontSize: 12, fontWeight: "800" },
  deactivateButton: { minHeight: 42, minWidth: 120, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: "#F3B85B66", borderRadius: 10, backgroundColor: "#F3B85B12" },
  deactivateText: { color: COLORS.amber, fontSize: 12, fontWeight: "700" },
  disabledButton: { opacity: 0.45 },
  updateMessage: { color: COLORS.red, fontSize: 11, marginTop: 11 },
  noteCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 15, backgroundColor: "#67E8C40E", borderWidth: 1, borderColor: "#67E8C433", borderRadius: 14 },
  note: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 17 },
});
