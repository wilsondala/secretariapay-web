# SecretáriaPay Web — Fase Frontend 2

Painel institucional do SecretáriaPay Académico / IMETRO.

## Stack
React + Vite + JavaScript + Tailwind CSS + Axios + React Router.

## Instalar
```bash
cp .env.example .env
npm install
npm run dev
```

## API
O frontend usa:

- `POST /api/v1/auth/login`
- `GET /api/v1/students`
- `GET /api/v1/students/{id}`
- `GET /api/v1/students/number/{studentNumber}`
- `GET /api/v1/charges`
- `GET /api/v1/charges/student/{studentId}`
- `GET /api/v1/public/payment-guides/{chargeCode}/pdf`
- `POST /api/v1/secretariapay/financial-flow/charges/{chargeId}/send-guide`
- `POST /api/v1/imetro/tuition-charges/generate`
- `POST /api/v1/imetro/tuition-charges/send-guides`

## Entregue nesta fase

- Dashboard com dados reais de estudantes e cobranças.
- Tela real de estudantes com busca, filtros, detalhe e resumo financeiro.
- Tela real de cobranças com busca, filtros, detalhe, guia PDF e envio de guia.
- Serviços Axios separados para estudantes, cobranças e dashboard.
- Estados de loading, erro e vazio.
- Componentes de status e formatação institucional IMETRO/DCR.
