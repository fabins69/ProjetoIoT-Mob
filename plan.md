# Plano de implementação — PjIoT

## Escopo e arquitetura

Construir uma aplicação única em **React Native com Expo** para Web, Android e iOS. O backend Laravel continua sendo proprietário dos cadastros e dados; a aplicação usa Expo Router, com cliente HTTP em `lib/iot/api.ts`, tipos em `lib/iot/types.ts`, telas em `app/` e componentes partilhados em `components/iot/`. A URL fica centralizada em `EXPO_PUBLIC_API_BASE_URL`.

A captura do Swagger e os exemplos enviados confirmam estas operações:

| Método e caminho | Contrato confirmado |
|---|---|
| `GET /api/sensor/status/listar` | Resposta `{ success, data: [{ codigo, tipo, status }] }`; `status` é numérico `0`/`1`. O exemplo recebido lista 40 sensores. |
| `GET /api/sensor/status/visualizar/{codigo}` | Exemplo `{"success":"Registro encontrado com sucesso","status":1}`. |
| `PUT /api/sensor/status/atualizar` | Corpo `{"codigo":"S1","status":true}`; resposta `{"status":true,"message":"Atualizado"}`. |
| `POST /api/registro` | Rota de gravação de leitura. A cópia Laravel atual no GitHub indica corpo `cod_sensor`, `valor`, `unidade` e horário definido no servidor; confirmar se a implementação corrente mantém esses campos. |

O GitHub contém uma cópia de `routes/api.php` mais antiga, com apenas `POST /api/registro` e `GET /api/registro/valor`; ela diverge do Swagger atual. Usar os quatro endpoints descritos nas informações mais recentes do usuário e não alterar o backend. A documentação disponível não mostra uma rota GET para histórico de leituras, portanto o app não inventa essa funcionalidade.

`GET /listar` alimenta o inventário; `GET /visualizar/{codigo}` alimenta o detalhe; `PUT /atualizar` altera o status somente quando o usuário escolhe Ativar/Desativar; `POST /registro` oferece formulário de envio de leitura. Respostas, erros, carregamento, lista vazia e falha de rede são estados visíveis. Não há dados de sensor fixos na aplicação.

O host `10.137.11.6` é privado e precisa ser alcançável pelo navegador/dispositivo. Web em HTTPS exige endpoint HTTPS acessível e CORS no Laravel; aplicações nativas de produção também podem exigir HTTPS por política de transporte.

## Estrutura principal

- `app/(tabs)/index.tsx`: visão geral, resumo do inventário e lista de sensores cadastrados.
- `app/sensor/[codigo].tsx`: detalhe por código e controles de status.
- `components/iot/`: cartões, indicadores e estados compartilhados entre Web e React Native.
- `lib/iot/api.ts`: chamadas HTTP para listar, consultar, atualizar status e registrar leituras.
- `lib/iot/types.ts`: modelos de sensores, leituras e corpo de atualização.
- `app.config.ts`, `.env.example` e `README.md`: identidade, URL e instruções de configuração/execução.

## Design

Três direções consideradas, com probabilidades de cauda abaixo de 0,10: **console de telemetria escuro (0,07)**; **editorial suíço de laboratório (0,05)**; **instrumentação industrial brutalista (0,08)**. Direção escolhida: console de telemetria escuro, técnico e preciso.

Movimento de instrumentação digital contemporânea. Princípios: dados primeiro, contraste alto, hierarquia estável e conexão explícita. Azul-petróleo profundo comunica foco e confiança; mint/ciano é a assinatura de conexão; verde representa normalidade e âmbar/vermelho ficam reservados a atenção e erro. O desktop usa navegação lateral e área ampla de leitura; o telefone prioriza consulta e cartões verticais para uso com uma mão. Elementos distintivos: nó com pulso, linhas discretas de telemetria e etiquetas monoespaçadas para códigos. Interações diretas, com retorno claro para carregamento, ausência e erro; animação de pulso sutil, sem movimento decorativo contínuo e respeitando movimento reduzido.

Tipografia sans-serif de sistema (SF/Roboto) e monoespaçada de sistema para códigos. Essência: acompanhar sensores já cadastrados sem recriar o backend; personalidade clara, técnica e confiável. Voz objetiva: “Leituras no ponto.” e “Confira o status de cada sensor.” Wordmark textual “PjIoT” com “IoT” em mint e marca geométrica de nó/pulso, sem texto no ícone. Cor de assinatura: mint elétrico `#67E8C4` sobre azul-petróleo `#071B20`.

## Limites conhecidos

Os exemplos completos de listagem, consulta e PUT foram recebidos. A gravação POST continua baseada no controlador Laravel antigo até o usuário confirmar se o schema atual ainda é o mesmo; o endereço privado não pode ser alcançado pelo Sandbox, portanto a resposta real do servidor não pode ser validada a partir daqui.