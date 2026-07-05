# SecretáriaPay Web — Fase Frontend 8.1

Ajustes finais para apresentação ao cliente IMETRO/DCR.

## Entrou nesta fase

- Nova rota `/demo`: roteiro de demonstração para reunião com o cliente.
- Nova rota `/about`: visão institucional do sistema.
- Sidebar com atalhos “Apresentação” e “Sobre”.
- Rodapé lateral com versão do painel.
- Topbar com etiqueta de ambiente.
- Mensagens de erro mais amigáveis para endpoints ainda em padronização.
- Componentes reutilizáveis: `PageHeader` e `ClientNotice`.

## Aplicação

Copie os arquivos deste ZIP para a raiz do projeto `secretariapay-web`, mantendo a estrutura de pastas.

Depois execute:

```powershell
cd C:\Users\dalaw\secretariapay-web
npm run build
git status
git add .
git commit -m "feat: add client demo and about pages"
git push origin main
```

## Rotas novas

- `/demo`
- `/about`
