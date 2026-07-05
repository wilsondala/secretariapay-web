# SecretáriaPay Web — Fase Frontend 6

Painel institucional IMETRO/DCR em React + JavaScript + Tailwind.

## Fase 6 — Configurações DCR/IMETRO

Esta fase adiciona a tela `/settings` com:

- Dados institucionais do IMETRO
- Política DCR de multa, dívida e inadimplência
- Simulador de regra DCR
- Catálogo de serviços cobrados
- Formas de pagamento
- Canais WhatsApp, e-mail, SMS e PDF
- Regras de segurança operacional

A tela tenta consumir endpoints reais da API e usa fallback demonstrativo quando algum endpoint administrativo ainda não estiver padronizado.

## Rodar local

```bash
npm install
npm run dev
```

URL local:

```txt
http://localhost:5173/settings
```
