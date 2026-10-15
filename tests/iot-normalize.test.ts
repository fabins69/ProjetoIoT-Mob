import { describe, expect, it } from "vitest";

import { normalizeSensor, normalizeSensors } from "../lib/iot/normalize";

describe("normalização do contrato PjIoT", () => {
  it("lê o inventário dentro de success/data e preserva status numérico 0/1", () => {
    const result = normalizeSensors({
      success: "Registros encontrados com sucesso",
      data: [
        { codigo: "S1", tipo: "luminosidade", status: 1 },
        { codigo: "S4", tipo: "umidade", status: 0 },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ codigo: "S1", tipo: "luminosidade", status: 1 });
    expect(result[1]).toMatchObject({ codigo: "S4", tipo: "umidade", status: 0 });
  });

  it("usa o código da rota quando a resposta de visualização traz somente success/status", () => {
    const result = normalizeSensor(
      { success: "Registro encontrado com sucesso", status: 1 },
      "S1",
    );

    expect(result).toMatchObject({ codigo: "S1", status: 1 });
  });
});
