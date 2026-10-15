# PjIoT

Aplicativo multiplataforma em React Native com Expo para Web, Android e iOS. O painel lê os sensores já cadastrados no backend Laravel; não recria o cadastro.

## Abrir no VS Code e iniciar o Expo

1. Extraia o pacote PjIoT em uma pasta do seu computador. Como o projeto da captura usa outro starter (`App.js`, `app.json` e `index.js`), prefira uma pasta própria ou faça backup antes de substituir arquivos.
2. Abra a pasta do projeto no VS Code e crie o `.env` a partir do exemplo: no PowerShell, `Copy-Item .env.example .env`; no Prompt de Comando, `copy .env.example .env`.
3. No terminal integrado do VS Code, rode:

   ```bash
   npm install
   npx expo start
   ```

4. Quando o Metro estiver pronto, pressione **w** no terminal para abrir a versão Web. Para o app móvel, abra o QR Code com o Expo Go.

## API

`.env.example` define `EXPO_PUBLIC_API_BASE_URL=http://10.137.11.6`. Troque pelo endereço alcançável no computador ou no celular. O IP `10.137.11.6` é privado; o dispositivo precisa estar na rede que alcança o Laravel. A versão Web local via `http://localhost:8081` também precisa que CORS no Laravel permita essa origem. Em uma hospedagem HTTPS, o navegador exige uma API HTTPS acessível; aplicativos nativos de produção também podem exigir HTTPS por política de transporte.

Contratos recebidos da documentação:

- `GET /api/sensor/status/listar` retorna `{ success, data: [{ codigo, tipo, status }] }`, com `status` numérico `0/1`.
- `GET /api/sensor/status/visualizar/{codigo}` retorna `success` e `status`, por exemplo `{ "success": "Registro encontrado com sucesso", "status": 1 }`.
- `PUT /api/sensor/status/atualizar` recebe `{ "codigo": "S1", "status": true }` e retorna `{ "status": true, "message": "Atualizado" }`.
- `POST /api/registro` grava uma leitura. A cópia Laravel atual disponível no GitHub indica `cod_sensor`, `valor` e `unidade`, com data/hora definida pelo servidor; confirmar se a implantação atual preserva o mesmo corpo.

A documentação atual não mostra uma rota GET de histórico de leituras, então a interface não apresenta leituras históricas inventadas. A cópia de `routes/api.php` no GitHub é antiga e difere das rotas de status mostradas pelo usuário.

## Verificações do projeto

```bash
npm run check
npm run lint
npm test
```
