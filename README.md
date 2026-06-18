# FEBAJE - Bolao da Copa do Mundo 2026

Base inicial do sistema do bolao, sem integracao com API externa. Jogos, resultados e ajustes serao cadastrados manualmente pelo admin.

## Setup

1. Instale as dependencias:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

3. Rode a migration em `supabase/migrations/20260618100000_initial_febaje.sql`.

4. Crie usuarios no Supabase Auth usando o e-mail interno `username@febaje.local` e a senha inicial `12345678`.

5. Defina o primeiro admin pelo SQL Editor do Supabase, usando uma conexao com privilegios de owner/service role:

```sql
select public.set_first_admin('seu_username');
```

A funcao so funciona enquanto nao existir nenhum admin e nao fica disponivel para usuarios `anon` ou `authenticated`.

## Desenvolvimento

```bash
npm run dev
```

Rotas implementadas: `/auth`, `/change-password`, `/dashboard`, `/ranking` e `/admin`.
