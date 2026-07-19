# Matriz de validação visual — pedidos de serviços académicos

## Escopo

Validar a rota `/academic-service-orders` integrada ao backend do PR correspondente, sem merge e sem deploy em produção.

## Resoluções mínimas

- Desktop: 1440 × 900;
- Notebook: 1366 × 768;
- Tablet: 768 × 1024;
- Mobile: 390 × 844;
- modos claro e escuro.

## DCR

- item **Pedidos de serviços** visível no menu;
- botão **Novo pedido** visível;
- seleção de estudante e serviço com preço institucional;
- criação inicia em `SOLICITADO`;
- emissão da cobrança muda para `AGUARDANDO_PAGAMENTO`;
- aviso informa que a Secretaria só recebe o pedido depois do pagamento;
- ações de gerar, imprimir, assinar, notificar e entregar não aparecem.

## Secretaria

- item **Pedidos de serviços** visível;
- pedido em `PAGO` oferece **Gerar documento**;
- documento gerado oferece **Colocar na fila de impressão**;
- `PRONTO_PARA_IMPRESSAO` oferece **Registar impressão**;
- `IMPRESSO` oferece **Encaminhar para assinatura**;
- em `AGUARDANDO_ASSINATURA`, a assinatura não aparece para a Secretaria;
- após `ASSINADO`, é obrigatório confirmar o local físico;
- WhatsApp aparece somente em `PRONTO_PARA_LEVANTAMENTO`;
- entrega aparece somente em `WHATSAPP_ENVIADO`;
- nome e documento de identificação de quem levantou são obrigatórios.

## Direção

- visualiza pedidos em `AGUARDANDO_ASSINATURA`;
- botão **Assinar documento** visível somente para Direção e administradores;
- não visualiza ações de cobrança, impressão, WhatsApp ou entrega.

## Fila operacional

Confirmar a ordem:

1. Solicitado;
2. Aguardando pagamento;
3. Pago;
4. Documento gerado;
5. Pronto para impressão;
6. Impresso;
7. Aguardando assinatura;
8. Assinado;
9. Pronto para levantamento;
10. WhatsApp enviado;
11. Entregue.

A linha do tempo deve manter a leitura correta sem corte ou sobreposição em todas as resoluções.

## Arquivo de documentos

- aba **Arquivo de documentos** acessível;
- documentos aparecem no arquivo a partir de `ASSINADO`;
- busca funciona por pedido, estudante, matrícula, serviço e cobrança;
- filtros de estado funcionam;
- detalhe exibe responsáveis e datas;
- PDF abre em nova aba;
- entrega arquivada mostra nome, identificação e observações.

## Critério de aprovação

- nenhum botão fora da competência do perfil;
- nenhuma ação disponibilizada antes do estado correto;
- ausência de overflow horizontal na página e no painel lateral;
- contraste legível em claro e escuro;
- botões com estados de carregamento e bloqueio durante requisições;
- mensagens de erro e sucesso visíveis;
- `npm run validate:academic-service-orders` aprovado;
- `npm run build` aprovado.
