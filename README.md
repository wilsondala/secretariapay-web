# SecretáriaPay Académico — Frontend Fase 3

Painel institucional IMETRO/DCR em React + JavaScript + Tailwind.

## Fase 3

Inclui as telas reais para:

- `/proofs` — Comprovativos e validação manual da DCR
- `/receipts` — Recibos institucionais emitidos após validação

Também mantém as fases anteriores:

- Login
- Layout protegido
- Dashboard
- Estudantes
- Cobranças/propinas

## Endpoints usados

A tela de comprovativos tenta os endpoints compatíveis:

- `GET /api/v1/payment-proofs`
- `GET /api/v1/payment-proofs/status/{status}`
- `PATCH /api/v1/payment-proofs/{id}/approve`
- `PATCH /api/v1/payment-proofs/{id}/reject`

A tela de recibos tenta:

- `GET /api/v1/receipts`
- `GET /api/v1/receipts/student/{studentId}`
- `GET /api/v1/receipts/{id}`

Caso o backend use prefixo alternativo, os services têm fallback para rotas equivalentes.

## Rodar local

```powershell
cd C:\Users\dalaw\secretariapay-web
npm install
npm run dev
```

## Build

```powershell
npm run build
```
