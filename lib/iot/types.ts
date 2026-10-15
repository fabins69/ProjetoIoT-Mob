export type SensorStatusValue = boolean | number | string | null;

export type Sensor = {
  codigo: string;
  tipo?: string;
  status?: SensorStatusValue;
  descricao?: string;
  ambiente?: string;
  ambiente_id?: number;
  id?: number;
  raw?: Record<string, unknown>;
};

export type ReadingInput = {
  cod_sensor: string;
  valor: string;
  unidade: string;
};

export type SensorStatusUpdateBody = {
  codigo: string;
  status: boolean;
};

export type ApiEnvelope<T> = {
  data?: T;
  success?: string;
  message?: string;
  error?: string;
};
