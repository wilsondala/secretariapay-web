# Fase Frontend 8.3 — Dashboard Institucional IMETRO/DCR

## Objectivo

Transformar o Dashboard do SecretáriaPay Académico em uma tela institucional moderna, semelhante ao modelo visual aprovado pelo cliente, mantendo o contexto do IMETRO e da DCR — Divisão de Cobranças e Recebimentos.

A tela passa a funcionar como painel principal de apresentação e operação diária da DCR, mostrando indicadores financeiros, académicos e operacionais em uma única visão.

## Páginas e arquivos alterados

### `src/pages/DashboardPage.jsx`

Dashboard redesenhado com:

- Banner institucional em azul escuro.
- Cards de indicadores principais.
- Fluxo operacional da DCR em etapas.
- Alertas críticos.
- Resumo financeiro com gráfico circular.
- Evolução das cobranças com gráfico de linha em SVG.
- Atividades recentes.
- Rodapé institucional.

A página continua carregando dados reais por meio de `loadDashboardSummary()` e `/actuator/health`.

### `src/layouts/Sidebar.jsx`

Menu lateral redesenhado para seguir o padrão visual da imagem de referência:

- Fundo azul institucional.
- Marca SecretáriaPay Académico.
- Itens com ícones maiores.
- Item activo em amarelo/dourado.
- Bloco inferior com instituição e versão.
- Inclusão do item `Relatórios`.

### `src/layouts/Topbar.jsx`

Topo ajustado com:

- Nome da DCR.
- Botão `Atualizar dados`.
- Botão `Gerar relatório`.
- Botão `Enviar cobranças WhatsApp`.
- Notificações.
- Perfil do administrador.

### `src/layouts/AppLayout.jsx`

Ajuste de largura do menu lateral e espaçamento do conteúdo para suportar o novo layout.

### `src/pages/ReportsPage.jsx`

Nova página base para relatórios institucionais:

- Relatório financeiro da DCR.
- Relatório de cobranças WhatsApp.
- Relatório de comprovativos e recibos.

Nesta fase, a tela fica preparada para exportação PDF/Excel em uma fase posterior.

### `src/App.jsx`

Adicionada rota protegida:

```text
/reports
```

### `package.json` e `vercel.json`

Mantida configuração estável para deploy na Vercel:

- Node 20.
- npm 10.
- `npm ci --no-audit --no-fund --legacy-peer-deps`.
- Build Vite.
- Output `dist`.
- Rewrite para SPA.

## Indicadores exibidos no Dashboard

- Estudantes cadastrados.
- Cobranças pendentes.
- Mensalidades vencidas.
- Total em aberto.
- Alunos sem contacto oficial.
- Valor vencido/em atraso.
- Comprovativos pendentes.
- Fluxo operacional da DCR.
- Resumo financeiro.
- Evolução das cobranças.
- Atividades recentes.

## Regras mantidas

- O painel continua protegido por login.
- A demo pública continua fora do painel em `/apresentacao` e `/demo-publica`.
- O Dashboard usa dados reais quando disponíveis.
- Quando não houver dados suficientes para gráfico mensal, o sistema usa valores demonstrativos controlados apenas para apresentação visual.
- O SecretáriaPay continua posicionado como plataforma institucional, não apenas robô de WhatsApp.

## Como testar localmente

```powershell
cd C:\Users\dalaw\secretariapay-web
npm install --no-audit --no-fund --legacy-peer-deps
npm run build
npm run dev
```

Abrir:

```text
http://localhost:5173/dashboard
http://localhost:5173/reports
```

## Como publicar

```powershell
git status
git add .
git commit -m "feat: redesign institutional dashboard"
git push origin main
```

A Vercel fará o redeploy automático.

Após o deploy, testar:

```text
https://painel-secretariapay.paixaoangola.com/dashboard
https://painel-secretariapay.paixaoangola.com/reports
```

## Próxima fase sugerida

Fase 8.4 — Exportação de relatórios PDF/Excel para DCR.

Sugestões:

- Relatório financeiro mensal.
- Relatório de inadimplência.
- Relatório de cobranças WhatsApp.
- Relatório de estudantes sem contacto oficial.
- Relatório de comprovativos pendentes.
