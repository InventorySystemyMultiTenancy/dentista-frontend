# Dentista — Frontend

Painel administrativo e portal do paciente da clínica odontológica. Next.js (App Router) +
TypeScript + Tailwind CSS. Consome a API do [backend](../backend).

## Stack

- Next.js 16 (App Router)
- TypeScript + Tailwind CSS v4
- recharts (gráficos)
- Autenticação via cookie httpOnly setado pelo backend (domínio separado em produção)

## Rodando localmente

1. Suba o backend primeiro (veja `../backend/README.md`), rodando em `http://localhost:3001`.
2. Copie `.env.example` para `.env.local` e ajuste `NEXT_PUBLIC_API_URL` se necessário.
3. Instale as dependências e rode o servidor de desenvolvimento:
   ```
   npm install
   npm run dev
   ```
4. Acesse `http://localhost:3000`. A rota `/` redireciona para `/login`.

## Estrutura

```
app/
  login/page.tsx              # login único (admin/funcionário/paciente)
  ativar-conta/page.tsx        # paciente define senha a partir do link de convite
  (admin)/dashboard/           # painel administrativo (protegido por RequireRole)
    page.tsx                   # visão geral
    pacientes/                 # lista + detalhe (agendamentos, exames)
    agenda/                    # agenda do dia por profissional + aviso via WhatsApp
    exames/                    # gráficos de resultados/estados dos pacientes
    financeiro/                # contas a pagar/receber + resumo
    estoque/                   # itens e movimentações de estoque
    funcionarios/              # cadastro de funcionários + permissões (admin only)
  (patient)/portal/            # área do paciente (protegida por RequireRole)
    page.tsx, agendamentos/, exames/
lib/
  api.ts                      # wrapper fetch (credentials: include)
  auth-context.tsx            # sessão do usuário (checada via GET /auth/me)
  types.ts, format.ts, chart-colors.ts
components/
  ui/                         # Button, Input, Modal, Badge, StatCard
  Sidebar.tsx, PortalHeader.tsx, RequireRole.tsx
```

## Autenticação entre domínios diferentes

O cookie de sessão é definido pelo **backend** (domínio `onrender.com` em produção), não pelo
frontend (`vercel.app`). Por isso a proteção de rotas não usa `proxy.ts` do Next (que não teria
acesso a esse cookie) — cada área protegida usa o componente `RequireRole`, que consulta
`GET /auth/me` no cliente (o navegador envia o cookie automaticamente para o domínio do backend)
e redireciona conforme o papel do usuário.

## Portal do paciente — fundo com vídeo (pendente)

O layout em `app/(patient)/portal/layout.tsx` tem um `TODO` marcando onde entrará o fundo com
vídeo em "scroll-scrubbing" (o vídeo avança conforme o scroll da página). Essa parte será
implementada depois, com instruções específicas do cliente.

## Deploy na Vercel

1. Importe o repositório `dentista-frontend` na Vercel.
2. Configure a variável de ambiente `NEXT_PUBLIC_API_URL` apontando para a URL da API no Render
   (ex.: `https://dentista-backend.onrender.com/api`).
3. Deploy automático a cada push na branch principal.
