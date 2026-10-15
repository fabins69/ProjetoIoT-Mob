import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getApiBaseUrl, listarSensores, salvarLeitura, visualizarSensor } from "@/lib/iot/api";
import type { Sensor } from "@/lib/iot/types";
import { COLORS, MetricCard, SectionTitle, SensorCard, statusKind } from "@/components/iot/sensor-ui";

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;
  const compact = width < 540;
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [readingCode, setReadingCode] = useState("");
  const [readingValue, setReadingValue] = useState("");
  const [readingUnit, setReadingUnit] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const loadSensors = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const result = await listarSensores();
      setSensors(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os sensores.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let current = true;
    listarSensores()
      .then((result) => { if (current) setSensors(result); })
      .catch((cause) => { if (current) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os sensores."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const activeCount = useMemo(
    () => sensors.filter((sensor) => statusKind(sensor.status) === "active").length,
    [sensors],
  );
  const inactiveCount = useMemo(
    () => sensors.filter((sensor) => statusKind(sensor.status) === "inactive").length,
    [sensors],
  );

  const searchSensor = async () => {
    const normalized = code.trim();
    if (!normalized) {
      setSearchError("Informe o código do sensor.");
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const sensor = await visualizarSensor(normalized);
      setSensors((current) => {
        const exists = current.some((item) => item.codigo === sensor.codigo);
        return exists ? current.map((item) => item.codigo === sensor.codigo ? { ...item, ...sensor } : item) : [sensor, ...current];
      });
      router.push({ pathname: "/sensor/[codigo]", params: { codigo: sensor.codigo } });
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "Não foi possível consultar esse sensor.");
    } finally {
      setSearching(false);
    }
  };

  const submitReading = async () => {
    if (!readingCode.trim() || !readingValue.trim() || !readingUnit.trim()) {
      setFormMessage("Preencha o código, o valor e a unidade.");
      return;
    }
    setSaving(true);
    setFormMessage(null);
    try {
      await salvarLeitura({
        cod_sensor: readingCode.trim(),
        valor: readingValue.trim(),
        unidade: readingUnit.trim(),
      });
      setFormMessage("Leitura enviada ao backend.");
      setReadingValue("");
      await loadSensors();
    } catch (cause) {
      setFormMessage(cause instanceof Error ? cause.message : "Não foi possível salvar a leitura.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.page, wide && styles.pageWide]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadSensors()} tintColor={COLORS.mint} />}
      >
        {wide ? (
          <View style={styles.sidebar}>
            <Brand />
            <Text style={styles.navLabel}>ESPAÇO DE TRABALHO</Text>
            <View style={styles.navActive}>
              <Ionicons name="grid-outline" size={17} color={COLORS.mint} />
              <Text style={styles.navActiveText}>Visão geral</Text>
            </View>
            <View style={styles.navItem}>
              <Ionicons name="hardware-chip-outline" size={17} color={COLORS.muted} />
              <Text style={styles.navText}>Sensores</Text>
            </View>
            <View style={styles.sidebarBottom}>
              <View style={styles.connectionMark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.connectionTitle}>{getApiBaseUrl() ? "API configurada" : "API não configurada"}</Text>
                <Text style={styles.connectionSub}>Conexão do ambiente</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.main}>
          <View style={styles.header}>
            {!wide ? <Brand compact={compact} /> : <View />}
            <View style={styles.headerActions}>
              <View style={styles.liveBadge}>
                <View style={[styles.liveDot, { backgroundColor: getApiBaseUrl() ? COLORS.green : COLORS.amber }]} />
                <Text style={styles.liveText}>{getApiBaseUrl() ? "API configurada" : "Configure a API"}</Text>
              </View>
              <Pressable onPress={() => void loadSensors()} style={styles.refreshButton} accessibilityRole="button" accessibilityLabel="Atualizar sensores">
                <Ionicons name="refresh" size={17} color={COLORS.text} />
                {!compact ? <Text style={styles.refreshLabel}>Atualizar</Text> : null}
              </Pressable>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.kicker}>MONITORAMENTO IOT / PAINEL</Text>
            <Text style={[styles.title, compact && styles.titleCompact]}>Leituras no ponto.</Text>
            <Text style={styles.subtitle}>Acompanhe os sensores cadastrados e consulte o status de cada dispositivo.</Text>
          </View>

          <View style={styles.metricRow}>
            <MetricCard label="Sensores listados" value={loading ? "—" : sensors.length} icon="hardware-chip-outline" />
            <MetricCard label="Ativos" value={loading ? "—" : activeCount} icon="pulse-outline" accent={COLORS.green} />
            <MetricCard label="Inativos" value={loading ? "—" : inactiveCount} icon="alert-circle-outline" accent={COLORS.amber} />
          </View>

          <View style={styles.searchPanel}>
            <View style={styles.searchCopy}>
              <View style={styles.searchIcon}><Ionicons name="search" size={18} color={COLORS.mint} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.panelTitle}>Consultar por código</Text>
                <Text style={styles.panelHint}>Acesse o status de um sensor específico.</Text>
              </View>
            </View>
            <View style={[styles.searchControls, compact && styles.searchControlsStack]}>
              <TextInput
                value={code}
                onChangeText={setCode}
                onSubmitEditing={() => void searchSensor()}
                placeholder="Ex.: TEMP01"
                placeholderTextColor="#6F8887"
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Código do sensor"
                style={styles.input}
              />
              <Pressable onPress={() => void searchSensor()} disabled={searching} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, compact && styles.fullButton]}>
                {searching ? <ActivityIndicator color={COLORS.background} size="small" /> : <Text style={styles.primaryButtonText}>Consultar</Text>}
                {!searching ? <Ionicons name="arrow-forward" size={16} color={COLORS.background} /> : null}
              </Pressable>
            </View>
            {searchError ? <Text style={styles.inlineError}>{searchError}</Text> : null}
          </View>

          <View style={styles.sensorSection}>
            <SectionTitle eyebrow="INVENTÁRIO" title="Sensores cadastrados" count={sensors.length} />
            {loading ? (
              <View style={styles.statePanel}><ActivityIndicator color={COLORS.mint} /><Text style={styles.stateTitle}>Buscando sensores…</Text><Text style={styles.stateCopy}>Consultando o inventário do backend.</Text></View>
            ) : error ? (
              <View style={styles.statePanel}>
                <View style={[styles.stateIcon, { backgroundColor: "#F2787818" }]}><Ionicons name="cloud-offline-outline" size={22} color={COLORS.red} /></View>
                <Text style={styles.stateTitle}>Não foi possível conectar</Text>
                <Text style={styles.stateCopy}>{error}</Text>
                <Pressable onPress={() => void loadSensors()} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Tentar novamente</Text></Pressable>
              </View>
            ) : sensors.length === 0 ? (
              <View style={styles.statePanel}>
                <View style={styles.stateIcon}><Ionicons name="hardware-chip-outline" size={22} color={COLORS.mint} /></View>
                <Text style={styles.stateTitle}>Nenhum sensor retornado</Text>
                <Text style={styles.stateCopy}>A API respondeu sem sensores. Se esperava encontrar dispositivos, confira o cadastro e o contrato do endpoint de listagem.</Text>
              </View>
            ) : (
              <View style={styles.sensorList}>
                {sensors.map((sensor) => (
                  <SensorCard
                    key={sensor.codigo}
                    sensor={sensor}
                    onPress={() => router.push({ pathname: "/sensor/[codigo]", params: { codigo: sensor.codigo } })}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.readingPanel}>
            <Pressable onPress={() => { setShowReadingForm((current) => !current); setFormMessage(null); }} style={styles.formHeader} accessibilityRole="button">
              <View style={styles.searchIcon}><Ionicons name="add-circle-outline" size={19} color={COLORS.mint} /></View>
              <View style={{ flex: 1 }}><Text style={styles.panelTitle}>Registrar leitura</Text><Text style={styles.panelHint}>Envie uma leitura usando a rota existente do backend.</Text></View>
              <Ionicons name={showReadingForm ? "chevron-up" : "chevron-down"} size={18} color={COLORS.muted} />
            </Pressable>
            {showReadingForm ? (
              <View style={styles.formBody}>
                <TextInput value={readingCode} onChangeText={setReadingCode} placeholder="Código do sensor" placeholderTextColor="#6F8887" autoCapitalize="characters" style={styles.input} />
                <View style={[styles.formInline, compact && styles.searchControlsStack]}>
                  <TextInput value={readingValue} onChangeText={setReadingValue} placeholder="Valor" placeholderTextColor="#6F8887" keyboardType="decimal-pad" style={[styles.input, { flex: 2 }]} />
                  <TextInput value={readingUnit} onChangeText={setReadingUnit} placeholder="Unidade (ex.: °C)" placeholderTextColor="#6F8887" style={[styles.input, { flex: 1 }]} />
                </View>
                <View style={[styles.formFooter, compact && styles.searchControlsStack]}>
                  <Text style={[styles.formMessage, formMessage?.includes("enviada") ? { color: COLORS.green } : null]}>{formMessage || "O horário é definido pelo backend."}</Text>
                  <Pressable onPress={() => void submitReading()} disabled={saving} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                    {saving ? <ActivityIndicator color={COLORS.background} size="small" /> : <Text style={styles.primaryButtonText}>Enviar leitura</Text>}
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>

          <Text style={styles.footerNote}>PjIoT · Os dados são consultados diretamente na API configurada.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}><Ionicons name="pulse" size={18} color={COLORS.background} /></View>
      <View>
        <Text style={[styles.brandName, compact && { fontSize: 17 }]}>Pj<Text style={{ color: COLORS.mint }}>IoT</Text></Text>
        {!compact ? <Text style={styles.brandCaption}>SENSOR NETWORK</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  page: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 36 },
  pageWide: { flexDirection: "row", paddingHorizontal: 0, paddingBottom: 0 },
  sidebar: { width: 236, minHeight: "100%", paddingHorizontal: 22, paddingTop: 32, paddingBottom: 26, backgroundColor: "#09191D", borderRightWidth: 1, borderRightColor: COLORS.border },
  brand: { flexDirection: "row", alignItems: "center", gap: 11 },
  brandMark: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.mint },
  brandName: { color: COLORS.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.6 },
  brandCaption: { color: COLORS.muted, fontSize: 9, fontWeight: "700", letterSpacing: 1.5, marginTop: 2 },
  navLabel: { color: "#637D7D", fontSize: 9, fontWeight: "800", letterSpacing: 1.6, marginTop: 54, marginBottom: 14 },
  navActive: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 11, backgroundColor: "#67E8C414" },
  navActiveText: { color: COLORS.mint, fontSize: 13, fontWeight: "700" },
  navItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 12 },
  navText: { color: COLORS.muted, fontSize: 13, fontWeight: "600" },
  sidebarBottom: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: "auto", padding: 12, borderRadius: 12, backgroundColor: COLORS.surface },
  connectionMark: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.mint },
  connectionTitle: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  connectionSub: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  main: { width: "100%", maxWidth: 1200, flex: 1, alignSelf: "center", paddingHorizontal: 26, paddingTop: 25, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 40, marginBottom: 36 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.surface },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { color: COLORS.muted, fontSize: 11, fontWeight: "600" },
  refreshButton: { minHeight: 38, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10 },
  refreshLabel: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  intro: { marginBottom: 25 },
  kicker: { color: COLORS.mint, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginBottom: 10 },
  title: { color: COLORS.text, fontSize: 36, fontWeight: "800", letterSpacing: -1.6 },
  titleCompact: { fontSize: 29 },
  subtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 620 },
  metricRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 22 },
  searchPanel: { padding: 18, marginBottom: 30, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16 },
  searchCopy: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  searchIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#67E8C414" },
  panelTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  panelHint: { color: COLORS.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  searchControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchControlsStack: { flexDirection: "column", alignItems: "stretch" },
  input: { minHeight: 46, flex: 1, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, backgroundColor: COLORS.background, fontSize: 13, ...(Platform.OS === "web" ? { outlineStyle: "none" as never } : {}) },
  primaryButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 17, borderRadius: 10, backgroundColor: COLORS.mint },
  fullButton: { width: "100%" },
  primaryButtonText: { color: COLORS.background, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.82 },
  inlineError: { color: COLORS.red, fontSize: 12, marginTop: 9 },
  sensorSection: { marginBottom: 26 },
  sensorList: { gap: 10 },
  statePanel: { minHeight: 205, alignItems: "center", justifyContent: "center", padding: 24, borderWidth: 1, borderColor: COLORS.border, borderStyle: "dashed", borderRadius: 16, backgroundColor: COLORS.surface, gap: 9 },
  stateIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#67E8C414", marginBottom: 3 },
  stateTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700", textAlign: "center" },
  stateCopy: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 440 },
  secondaryButton: { paddingHorizontal: 14, paddingVertical: 10, marginTop: 7, borderWidth: 1, borderColor: COLORS.border, borderRadius: 9 },
  secondaryButtonText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  readingPanel: { marginTop: 2, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, backgroundColor: COLORS.surface, overflow: "hidden" },
  formHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 17 },
  formBody: { gap: 11, padding: 17, paddingTop: 0 },
  formInline: { flexDirection: "row", gap: 10 },
  formFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  formMessage: { flex: 1, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  footerNote: { color: "#617A79", fontSize: 10, textAlign: "center", marginTop: 27 },
});
