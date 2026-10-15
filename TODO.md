# TODO — PjIoT

## Aplicação Web e móvel
- [x] A aplicação é única em React com Expo e exporta bundles para Web, Android e iOS.
- [x] A navegação Expo Router inclui visão geral dos sensores e visualização detalhada por código.
- [x] A interface adapta o layout para desktop e telas móveis.

## Sensores cadastrados e dados
- [x] Consultar e exibir os sensores já cadastrados no backend, sem recriar nem substituir a camada de dados existente.
- [x] Exibir código, tipo e status fornecidos pela resposta real da API; normalizar `status` numérico `0/1`.
- [x] Apresentar carregamento, lista vazia, erro de comunicação e ausência de status sem valores fictícios.

## Operações documentadas
- [x] `GET /api/sensor/status/listar`: ler `{ success, data: [{ codigo, tipo, status }] }`. O exemplo fornecido pelo usuário contém 40 sensores; a lista é carregada em tempo de execução, não embutida na interface.
- [x] `GET /api/sensor/status/visualizar/{codigo}`: consultar a resposta `{ success, status }`, usando o código da rota porque a resposta não o repete.
- [x] `PUT /api/sensor/status/atualizar`: enviar `{ codigo, status }` com `status` booleano; os controles Ativar/Desativar usam o método e o corpo confirmados pelo usuário.
- [x] `POST /api/registro`: o formulário e a chamada estão implementados com `cod_sensor`, `valor` e `unidade`, conforme o controlador Laravel disponível no repositório.
- [ ] Confirmar se a implantação atual de `POST /api/registro` mantém o corpo `cod_sensor`, `valor` e `unidade`; a cópia do repositório é mais antiga que a documentação de status fornecida.

## Configuração e validação
- [x] Centralizar a URL em `EXPO_PUBLIC_API_BASE_URL`, incluir `.env.example` e documentar o endereço privado/CORS.
- [x] `pnpm check` e `pnpm lint` passaram.
- [x] `pnpm test`: 27 testes passaram e um teste já existente ficou ignorado.
- [x] `npx expo export --platform web`, `--platform android` e `--platform ios` concluíram.
- [x] Testes de normalização cobrem os formatos reais de listagem e visualização enviados pelo usuário.
- [ ] Validar chamadas HTTP contra o host `10.137.11.6` a partir do computador do usuário; o endereço é privado e não está acessível à Sandbox.
