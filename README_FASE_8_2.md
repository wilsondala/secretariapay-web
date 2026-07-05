# Fase Frontend 8.2 — Demo pública em carrossel IMETRO/DCR

Esta fase adiciona uma página de demonstração pública do SecretáriaPay Académico para apresentação ao IMETRO.

## Objetivo

Criar uma demo fora do painel administrativo, sem login, sem sidebar e sem dependência dos dados operacionais. A página funciona como uma apresentação institucional em formato carrossel para ser usada em reunião com o cliente.

## Nova rota pública

```txt
/apresentacao
/demo-publica
```

Exemplo em produção:

```txt
https://painel-secretariapay.paixaoangola.com/apresentacao
https://painel-secretariapay.paixaoangola.com/demo-publica
```

## O que foi criado

```txt
src/pages/PublicDemoCarouselPage.jsx
```

## O que foi alterado

```txt
src/App.jsx
```

Foram adicionadas rotas públicas antes do `ProtectedRoute`, para que a apresentação abra sem autenticação.

## Conteúdo da apresentação

A apresentação possui 12 slides:

1. SecretáriaPay Académico para o IMETRO
2. O desafio actual da cobrança académica
3. Uma plataforma, não apenas um robô
4. Segurança dos dados do estudante
5. Robô IMETRO/DCR com fluxo real
6. Geração e envio de guias de pagamento
7. Política DCR configurada
8. Validação manual de comprovativos e recibos
9. Sincronização WebSchool / dados académicos
10. Painel administrativo para responsáveis da faculdade
11. Benefícios esperados para o IMETRO
12. Próximos passos de validação controlada

## Como navegar

A página permite navegação por:

```txt
Botão Próximo
Botão Anterior
Lista lateral de slides
Teclas do teclado: ArrowRight e ArrowLeft
```

## Regra institucional destacada

A demo reforça a regra de ouro do projecto:

```txt
Mesmo que alguém peça informação por outro telefone, o sistema só envia informações financeiras, guias e recibos para os contactos oficialmente cadastrados no IMETRO.
```

## Como aplicar no Windows

```powershell
cd C:\Users\dalaw

Expand-Archive -Path "$env:USERPROFILE\Downloads\secretariapay-web-fase-frontend-8-2-demo-publica-carrossel.zip" -DestinationPath .\secretariapay-web-temp -Force

Copy-Item -Path .\secretariapay-web-temp\* -Destination .\secretariapay-web -Recurse -Force

Remove-Item .\secretariapay-web-temp -Recurse -Force

cd C:\Users\dalaw\secretariapay-web
npm run build
npm run dev
```

## Como testar local

```txt
http://localhost:5173/apresentacao
http://localhost:5173/demo-publica
```

## Como publicar

```powershell
git status
git add .
git commit -m "feat: add public IMETRO demo carousel"
git push origin main
```

A Vercel fará o redeploy automático.

## Como testar em produção

```txt
https://painel-secretariapay.paixaoangola.com/apresentacao
https://painel-secretariapay.paixaoangola.com/demo-publica
```

## Observação

Esta demo é pública e institucional. Ela não expõe dados reais de alunos, cobranças ou comprovativos. O painel administrativo continua protegido por login.
