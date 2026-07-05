# SecretáriaPay Web — Painel IMETRO/DCR

Frontend em React + JavaScript + Tailwind CSS para o SecretáriaPay Académico.

## Fases incluídas

- Fase 1: base institucional IMETRO/DCR, login, layout, sidebar, topbar, dashboard e proteção de rotas.
- Fase 2: telas reais de Estudantes e Cobranças ligadas à API.
- Fase 3: Comprovativos e Recibos com validação manual DCR.
- Fase 4: WhatsApp e histórico de mensagens.

## Rodar localmente

```powershell
npm install
copy .env.example .env
npm run dev
```

Acesse:

```text
http://localhost:5173
```

## API

O `.env.example` aponta para:

```env
VITE_API_BASE_URL=https://secretariapay-api.paixaoangola.com
```

## Fase 4 — WhatsApp

Nova rota:

```text
/whatsapp
```

A tela mostra:

- mensagens enviadas por WhatsApp, e-mail ou SMS;
- guias de pagamento enviadas;
- falhas de envio;
- estudantes sem contacto oficial;
- provider message id;
- abertura rápida do PDF da guia;
- sessões de atendimento do robô.

Os services tentam automaticamente endpoints compatíveis:

```text
GET /api/v1/admin/whatsapp/messages
GET /api/v1/secretariapay/whatsapp/messages
GET /api/v1/secretariapay/messages
GET /api/v1/whatsapp/messages

GET /api/v1/admin/whatsapp/sessions
GET /api/v1/secretariapay/whatsapp/sessions
GET /api/v1/whatsapp/sessions
```

Se o endpoint ainda não estiver disponível no backend, a tela abre com dados demonstrativos e mostra aviso institucional para criar o endpoint real.
