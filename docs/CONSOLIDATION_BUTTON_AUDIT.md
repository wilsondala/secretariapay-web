# Consolidação — Auditoria funcional dos botões

Data de início: 2026-07-11

Objetivo: confirmar que cada botão visível no painel SecretáriaPay possui ação real, endpoint correspondente, estado de carregamento, tratamento de erro e proteção por perfil.

## Critérios obrigatórios

Cada botão operacional deve cumprir todos os pontos abaixo:

- possuir `onClick`, `href` ou submissão de formulário funcional;
- chamar um serviço real do frontend;
- apontar para endpoint existente da API;
- respeitar a permissão do perfil conectado;
- bloquear cliques repetidos durante processamento;
- apresentar confirmação para ações destrutivas ou irreversíveis;
- apresentar mensagem de sucesso ou erro;
- não usar dados demonstrativos ou valores fixos de produção.

## Estado por tela

### Central de Operações

Estado: revisada.

- **Atualizar**: ligado ao carregamento de prontidão, notificações, auditoria e transações.
- **Rodar notificações**: ligado ao serviço real e protegido por `runFinancialNotifications`.
- **Simular geração**: ligado ao endpoint real com `dryRun=true`.
- **Gerar mensalidades**: ligado ao endpoint real, protegido por `generateMonthlyCharges` e exige confirmação.
- Campos operacionais ficam desativados para perfis de consulta.

Pendências de consolidação:

- substituir valores iniciais fixos do formulário por configuração institucional carregada da API;
- validar limites de ano, valor e dia de vencimento também no backend.

### Importações Académicas

Estado: revisada.

- **Atualizar**: recarrega lotes e mantém seleção atual.
- **Nova importação**: abre upload somente para perfil autorizado.
- **Histórico**: abre histórico real do lote.
- **Reprocessar**: ligado ao endpoint e exige confirmação.
- **Cancelar lote**: ligado ao endpoint, exige motivo e confirmação.
- **Relatório de erros**: baixa relatório real do lote.
- **Revalidar**: ligado ao endpoint de validação.
- **Concluir staging**: exibido somente quando o lote está validado e sem linhas inválidas.
- **Sincronizar**: exibido apenas em estados permitidos.
- **Editar linha**: protegido por permissão de importação.

Pendências de consolidação:

- substituir `alert`, `prompt` e `confirm` nativos por modal institucional;
- validar se todas as respostas de erro da API chegam com mensagem padronizada.

### Cobranças e Propinas

Estado: revisão funcional iniciada.

- botão demonstrativo **Gerar propinas teste** removido;
- **Atualizar**, **Enviar guias**, **Ver guia PDF** e **Enviar guia** estão ligados a serviços reais;
- envio em lote usa mês selecionado ou mês corrente;
- ações protegidas por perfil.

Pendências:

- confirmar contratos exatos dos endpoints de envio individual e em lote;
- revisar confirmação manual e cancelamento de cobrança nas telas onde forem expostos;
- validar nomenclatura final dos PDFs.

### Comprovativos

Estado: pendente de fechamento.

Revisar:

- abrir anexo;
- aprovar;
- rejeitar;
- marcar em análise;
- payload do usuário revisor;
- emissão automática do recibo após aprovação.

### Recibos

Estado: pendente de fechamento.

Já disponível:

- atualizar;
- visualizar PDF;
- baixar PDF.

Ainda não devem ser exibidos até existirem endpoints oficiais:

- reenviar recibo;
- cancelar recibo;
- emitir segunda via controlada.

### WhatsApp Financeiro

Estado: pendente de fechamento.

Já disponível:

- atualizar histórico;
- consultar mensagens;
- consultar sessões;
- abrir guia associada quando houver cobrança.

Ainda não devem ser exibidos até existirem endpoints oficiais:

- reenviar mensagem;
- pausar fila;
- retomar fila;
- editar template;
- executar scheduler manualmente.

### Usuários e Permissões

Estado: pendente de revalidação após consolidação do backend.

Revisar:

- novo usuário;
- editar;
- ativar/desativar;
- redefinir palavra-passe;
- compatibilidade entre perfis do frontend e autoridades do backend.

## Ordem de fechamento

1. Cobranças e Propinas.
2. Comprovativos.
3. Recibos.
4. WhatsApp Financeiro.
5. Usuários e Permissões.
6. Configurações e Relatórios.
7. Teste final por perfil.

Nenhuma nova ação visual deve ser adicionada sem endpoint real e permissão correspondente.
