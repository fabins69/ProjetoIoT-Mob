import Constants from "expo-constants";

import { normalizeSensor, normalizeSensors } from "./normalize";
import type { ApiEnvelope, ReadingInput, Sensor, SensorStatusUpdateBody } from "./types";

const EXTRA_API_URL = Constants.expoConfig?.extra?.apiBaseUrl;
const API_BASE_URL =
  (typeof EXTRA_API_URL === "string" && EXTRA_API_URL) ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL.replace(/\/+$/, "");
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError("URL da API não configurada. Defina EXPO_PUBLIC_API_BASE_URL no arquivo .env.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers, credentials: "omit" });
  } catch {
    throw new ApiError(
      `Não foi possível alcançar ${baseUrl}. Confira a rede, a URL e a configuração CORS do Laravel.`,
    );
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object"
        ? String(
            (payload as Record<string, unknown>).message ??
              (payload as Record<string, unknown>).error ??
              `A API respondeu com HTTP ${response.status}.`,
          )
        : `A API respondeu com HTTP ${response.status}.`;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}

export async function listarSensores(): Promise<Sensor[]> {
  const payload = await request<unknown>("/api/sensor/status/listar");
  const sensors = normalizeSensors(payload);
  if (!Array.isArray(payload) && sensors.length === 0) {
    const envelope = payload as ApiEnvelope<unknown> | null;
    if (envelope?.error) throw new ApiError(envelope.error);
  }
  return sensors;
}

export async function visualizarSensor(codigo: string): Promise<Sensor> {
  const safeCode = encodeURIComponent(codigo.trim());
  const payload = await request<unknown>(`/api/sensor/status/visualizar/${safeCode}`);
  const envelope = payload as ApiEnvelope<unknown> | null;
  if (envelope?.error) throw new ApiError(envelope.error);
  const sensor = normalizeSensor(payload, codigo.trim());
  if (!sensor) throw new ApiError("A resposta da API não contém os dados esperados do sensor.");
  return sensor;
}

export async function salvarLeitura(input: ReadingInput): Promise<unknown> {
  const payload = await request<unknown>("/api/registro", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const envelope = payload as ApiEnvelope<unknown> | null;
  if (envelope?.error) throw new ApiError(envelope.error);
  return payload;
}

export async function atualizarStatusSensor(codigo: string, status: boolean): Promise<{ status: boolean; message: string }> {
  const body: SensorStatusUpdateBody = { codigo, status };
  const payload = await request<{ status?: boolean; message?: string; error?: string }>("/api/sensor/status/atualizar", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (payload.error) throw new ApiError(payload.error);
  return {
    status: typeof payload.status === "boolean" ? payload.status : status,
    message: payload.message ?? "Status atualizado.",
  };
}
