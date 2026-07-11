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

Estado: revisão funcional concluída no frontend; contrato da API ainda precisa ser fechado.

Confirmado:

- botão demonstrativo **Gerar propinas teste** removido;
- **Atualizar** chama `GET /api/v1/charges`;
- **Enviar guia** chama `POST /api/v1/secretariapay/financial-flow/charges/{chargeId}/send-guide`;
- **Enviar guias** chama `POST /api/v1/imetro/tuition-charges/send-guides`;
- **Ver guia PDF** usa `GET /api/v1/public/payment-guides/{chargeCode}/pdf`;
- envio em lote usa mês selecionado ou mês corrente;
- ações de envio ficam escondidas para perfis sem `sendWhatsapp`;
- chamadas do serviço também validam a permissão antes de atingir a API;
- botões ficam bloqueados durante processamento.

Pendências de fechamento:

- confirmar na API os contratos definitivos dos endpoints de envio individual e em lote;
- remover do serviço qualquer rota alternativa quando o endpoint oficial estiver confirmado;
- expor confirmação manual e cancelamento somente quando houver ação visual com confirmação institucional;
- aplicar a nomenclatura final dos PDFs oficiais;
- substituir a mensagem genérica de envio pelo retorno padronizado do backend.

### Comprovativos

Estado: fechado no frontend; contrato único da API ainda precisa ser consolidado.

Confirmado:

- **Atualizar** recarrega comprovativos reais e preserva o item selecionado;
- **Ver anexo** usa sempre o endpoint autenticado de attachment, sem depender de `fileUrl` no objeto;
- **Aprovar** e **Rejeitar** aparecem somente para estados `PENDING`, `PENDING_REVIEW` ou `UNDER_REVIEW`;
- comprovativos já aprovados ou rejeitados entram em modo bloqueado contra duplicidade;
- aprovação exige confirmação explícita;
- rejeição exige motivo obrigatório e confirmação explícita;
- payload inclui `reviewNote` e, quando disponível, `reviewedByUserId` do utilizador autenticado;
- aprovação e rejeição estão protegidas por `validateProofs`;
- observação da DCR fica bloqueada para perfis de consulta e para comprovativos já processados;
- botões ficam bloqueados durante processamento;
- após a ação, a lista é recarregada, a seleção é preservada e a mensagem de sucesso/erro é exibida;
- o retorno com `receiptCode` é apresentado como recibo emitido; sem código, o painel informa que aguardará atualização do backend.

Pendências de integração:

- decidir se **Marcar em análise** será ação oficial; o serviço existe, mas o botão permanece oculto;
- padronizar definitivamente a resposta da aprovação com `receiptCode`, `receiptId` e `receiptStatus`;
- substituir os endpoints candidatos por uma única rota oficial.

### Recibos

Estado: revisão funcional concluída para consulta.

Confirmado:

- **Atualizar** recarrega recibos reais;
- **Baixar PDF** e **Ver recibo** apontam para o PDF real;
- nenhuma ação de reenvio, cancelamento ou segunda via é exibida sem endpoint oficial;
- permissões futuras já existem na matriz central (`issueReceipts`, `resendReceipts`, `cancelReceipts`);
- perfis sem ação financeira veem aviso de modo consulta.

Pendências de fechamento:

- substituir os endpoints candidatos por uma única rota oficial;
- confirmar se a rota pública final será por `receiptCode`;
- implementar reenvio somente depois do endpoint real e do template oficial de mensagem;
- implementar cancelamento apenas com motivo, confirmação e auditoria;
- definir a nomenclatura oficial do ficheiro PDF.

### WhatsApp Financeiro

Estado: revisão funcional concluída para monitorização; ações operacionais ainda não devem ser expostas.

Confirmado:

- **Atualizar histórico** carrega mensagens e sessões reais;
- filtros de estado, canal e tipo são funcionais;
- seleção de mensagem e sessão é apenas consulta;
- guia associada abre pelo código da cobrança quando disponível;
- mensagens demonstrativas foram removidas;
- quando nenhum endpoint responde, a tela informa que o histórico real está indisponível.

Pendências críticas:

- o serviço ainda tenta múltiplos endpoints candidatos para mensagens e sessões;
- o serviço contém `resendPaymentGuide`, mas a tela não expõe o botão até existir contrato oficial;
- remover tentativa de `GET` em endpoint de reenvio após consolidar a rota `POST` oficial;
- usar `env.apiBaseUrl` no lugar de leitura direta de `import.meta.env` na página;
- adicionar proteção por `resendWhatsapp` quando o reenvio for ativado;
- não expor **Pausar fila**, **Retomar fila**, **Editar template** ou **Executar scheduler** antes dos endpoints oficiais;
- consolidar estados de entrega (`SENT`, `DELIVERED`, `READ`, `FAILED`) conforme o callback real da Meta.

### Usuários e Permissões

Estado: pendente de revalidação após consolidação do backend.

Revisar:

- novo usuário;
- editar;
- ativar/desativar;
- redefinir palavra-passe;
- compatibilidade entre perfis do frontend e autoridades do backend.

### Configurações e Relatórios

Estado: pendente.

Revisar:

- salvar configurações institucionais;
- simular regra financeira;
- exportar PDF e Excel;
- garantir que botões indisponíveis não sejam exibidos;
- validar acesso por perfil no frontend e backend.

## Ordem de fechamento

1. Consolidar rota oficial de Cobranças e Guias.
2. Consolidar rota oficial de Recibos.
3. Consolidar rota oficial de WhatsApp.
4. Revalidar Usuários e Permissões.
5. Auditar Configurações e Relatórios.
6. Executar teste final por perfil.

Nenhuma nova ação visual deve ser adicionada sem endpoint real e permissão correspondente.
