import type { Sensor } from "./types";

function findList(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || depth > 3) return null;
  const object = value as Record<string, unknown>;
  for (const key of ["data", "sensores", "sensors", "resultado", "result", "items"]) {
    const nested = object[key];
    if (Array.isArray(nested)) return nested;
    const resolved = findList(nested, depth + 1);
    if (resolved) return resolved;
  }
  return null;
}

function toSensor(value: unknown): Sensor | null {
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  const nested = [object.sensor, object.data, object.resultado, object.result].find(
    (item) => item && typeof item === "object" && !Array.isArray(item),
  );
  const source = (nested as Record<string, unknown> | undefined) ?? object;
  const codigo = source.codigo ?? source.cod_sensor ?? source.code;
  if (codigo === undefined || codigo === null || String(codigo).trim() === "") return null;

  const status = source.status;
  return {
    codigo: String(codigo),
    tipo: typeof source.tipo === "string" ? source.tipo : typeof source.type === "string" ? source.type : undefined,
    status:
      typeof status === "boolean" || typeof status === "number" || typeof status === "string"
        ? status
        : null,
    descricao: typeof source.descricao === "string" ? source.descricao : undefined,
    ambiente: typeof source.ambiente === "string" ? source.ambiente : undefined,
    ambiente_id: typeof source.ambiente_id === "number" ? source.ambiente_id : undefined,
    id: typeof source.id === "number" ? source.id : undefined,
    raw: source,
  };
}

export function normalizeSensor(value: unknown, codigoFallback?: string): Sensor | null {
  const object = value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
  const nested = object
    ? [object.sensor, object.data, object.resultado, object.result].find(
        (item) => item && typeof item === "object" && !Array.isArray(item),
      )
    : undefined;
  const source = (nested as Record<string, unknown> | undefined) ?? object;
  const parsed = toSensor(value) ?? toSensor(source);
  if (parsed) return parsed;
  if (!codigoFallback) return null;

  const status = source?.status;
  return {
    codigo: codigoFallback,
    tipo: typeof source?.tipo === "string" ? source.tipo : undefined,
    status:
      typeof status === "boolean" || typeof status === "number" || typeof status === "string"
        ? status
        : null,
    descricao: typeof source?.descricao === "string" ? source.descricao : undefined,
    raw: source,
  };
}

export function normalizeSensors(value: unknown): Sensor[] {
  const list = findList(value);
  if (!list) return [];
  return list.map(toSensor).filter((sensor): sensor is Sensor => sensor !== null);
}
