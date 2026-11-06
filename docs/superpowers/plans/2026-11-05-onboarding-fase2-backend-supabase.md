# Onboarding com Supabase — plano de implementação (FASE 2, ADIADA)

> **Adiado em 05/11/2026 a pedido do usuário:** a fase 1 é só front-end (ver `2026-11-05-onboarding-fase1-frontend.md`). Este plano fica guardado para a fase de backend; quando for retomado, as Tasks 4 a 6 devem trocar a implementação de `src/lib/account.ts` em vez de recriar as telas.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o mock em `localStorage` por Supabase (auth, perfis, storage) e criar o onboarding de 3 passos que leva à área principal `/daily`, com rotas protegidas e RLS.

**Architecture:** Server actions + `@supabase/ssr` (sessão em cookies), `src/proxy.ts` renova a sessão e faz o redirecionamento otimista, e uma camada de acesso a dados (`src/lib/auth/dal.ts`) faz a checagem de verdade dentro de `<Suspense>`. O banco guarda perfis com RLS; o onboarding termina numa função SQL atômica. Regras de validação ficam num só arquivo TS usado no navegador e no servidor, espelhadas por constraints no banco.

**Tech Stack:** Next.js 16.4.5, React 19.3, `@supabase/supabase-js` 2.119, `@supabase/ssr` 0.12.7, Vitest 5.1, `@electric-sql/pglite` 0.5.15 (Postgres em WASM para testar SQL e RLS).

**Spec:** `docs/superpowers/specs/2026-11-05-onboarding-supabase-design.md`

## Global Constraints

- Não alterar o design ou a interface existente sem necessidade (telas novas usam `AuthShell`, `TextField`, `Button`, `Avatar` e tokens `closie-*`).
- Campos do onboarding: username único, nome de exibição, foto opcional, biografia opcional, privacidade inicial.
- Após concluir → área principal (`/daily`). Próximos logins → direto para `/daily`, sem repetir o onboarding.
- Segurança dos dados com RLS do Supabase.
- Idade mínima: `MIN_AGE = 13`.
- @: 3 a 20 caracteres, `[a-z0-9._]`, sem ponto no começo/fim, sem `..` (regras atuais de `checkUsername`).
- Nome de exibição: 1 a 50 caracteres depois de `trim`. Bio: até 160 caracteres.
- Privacidade: `public` | `friends` | `private`, padrão `friends` (`DEFAULT_VISIBILITY`).
- Next 16: middleware é `src/proxy.ts` (`export async function proxy`); com `cacheComponents`, `cookies()` só dentro de `<Suspense>`.
- Variáveis: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (aceita a anon key), `SUPABASE_SECRET_KEY` (aceita a service_role; só servidor).
- Textos em pt-BR informal ("pra", "você"), como o resto do app.
- O projeto não é repositório git: os passos "Commit" viram "rodar a verificação da task".

## Review Focus

- Link de confirmação aberto em outro navegador ou vencido → volta para `/entrar` com aviso, nunca erro 500. (Task 4: `confirmFailurePath`)
- Foto que não é imagem, maior que 10 MB ou que o navegador não decodifica (HEIC fora do Safari) → mensagem no passo 2 e nada é enviado. (Task 5: `checkAvatarFile`)
- Sessão encerrada no meio do onboarding (sair em outra aba) → concluir leva para `/entrar`, não "erro inesperado". (Task 5: `mapOnboardingError` com `42501`)
- Supabase ainda não configurado → `/entrar` e `/cadastro` abrem e as ações mostram aviso de configuração. (Task 3: `getSupabaseEnv`; Task 7: checagem no navegador)
- `next` malicioso (`//site.com`, `https://site.com`, `/\site.com`) → ignorado, vai para o destino padrão. (Task 3: `safeNextPath`)

---

### Task 1: Base de testes e regras compartilhadas

**Files:**
- Modify: `package.json` (devDeps `vitest@5.1.0`; script `"test": "vitest run"`)
- Create: `vitest.config.mts` (alias `@` → `src`, `environment: "node"`)
- Modify: `src/lib/validation.ts`
- Modify: `src/lib/mock.ts` (remover `mockTakenUsernames`)
- Test: `tests/unit/validation.test.ts`

**Interfaces:**
- Produces (em `src/lib/validation.ts`):
  - `RESERVED_USERNAMES: readonly string[]` — `closie, admin, administrador, suporte, support, ajuda, help, daily, oficial, official, root, sistema, system, api, auth, www, entrar, cadastro, onboarding, termos, privacidade, configuracoes, settings, moderacao, staff`
  - `type UsernameProblem = "empty" | "chars" | "dots" | "short" | "long" | "reserved"`
  - `checkUsernameFormat(username: string): UsernameCheck` (sem disponibilidade; mesma ordem de checagem de hoje, `reserved` por último)
  - `validateUsername(username: string): string | null` (mensagem de `checkUsernameFormat`)
  - `suggestUsernames(base: string): string[]` — até 6 candidatos com formato válido e não reservados (mesmos finais de hoje); quem filtra os livres é o banco
  - `DISPLAY_NAME_MAX = 50`, `validateDisplayName(value: string): string | null`
  - `BIO_MAX = 160`, `validateBio(value: string): string | null`
  - `VISIBILITIES = ["public", "friends", "private"] as const`, `isVisibility(value: unknown): value is Visibility`
  - Mantidos: `normalizeUsername`, `usernameFromEmail`, `validateEmail`, `validatePassword`, `validateBirthdate`, `MIN_AGE`

- [ ] **Step 1: Instalar Vitest e criar `vitest.config.mts`**
- [ ] **Step 2: Escrever os testes que falham**

```ts
expect(checkUsernameFormat("admin")).toMatchObject({ ok: false, problem: "reserved" });
expect(checkUsernameFormat("lua")).toEqual({ ok: true }); // "taken" não existe mais aqui
expect(checkUsernameFormat(".lua").ok).toBe(false);
expect(suggestUsernames("marcelo.coronet")).toEqual(
  expect.arrayContaining(["marcelo.coronet", "marcelo.daily"]),
);
expect(suggestUsernames("admin").includes("admin")).toBe(false);
expect(validateDisplayName("   ")).toBe("Diga como você quer ser chamado.");
expect(validateDisplayName("a".repeat(51))).toBe("O nome pode ter no máximo 50 caracteres.");
expect(validateBio("a".repeat(161))).toBe("A bio pode ter no máximo 160 caracteres.");
expect(validateBio("")).toBeNull();
expect(isVisibility("friends")).toBe(true);
expect(isVisibility("everyone")).toBe(false);
// 13+: nascido hoje há 13 anos passa; um dia depois, não
expect(validateBirthdate("2013-11-05", new Date(2026, 10, 5))).toBeNull();
expect(validateBirthdate("2013-11-06", new Date(2026, 10, 5))).toMatch(/13 anos/);
```

- [ ] **Step 3: `npx vitest run tests/unit/validation.test.ts` → FAIL (funções não existem)**
- [ ] **Step 4: Implementar em `src/lib/validation.ts`** (mensagem de reservado: "Esse @ não está disponível.")
- [ ] **Step 5: Rodar de novo → PASS; `npx tsc --noEmit` acusa os usos antigos de `checkUsername`/`suggestUsernames` (resolvidos nas Tasks 4 e 5)**

### Task 2: Banco — migração, RLS e storage, testados com PGlite

**Files:**
- Create: `supabase/migrations/20261105120000_perfis_onboarding.sql`
- Create: `tests/db/supabase-stub.sql` (esqueleto do Supabase: papéis `anon`, `authenticated`, `service_role bypassrls`; `auth.users(id, email, raw_user_meta_data)`; `auth.uid()` lendo `request.jwt.claims`; `storage.buckets`, `storage.objects` com RLS ligado; `storage.foldername(text)`; grants e default privileges iguais aos do Supabase)
- Create: `tests/db/harness.ts`
- Test: `tests/db/profiles.test.ts`, `tests/db/storage.test.ts`
- Modify: `package.json` (devDep `@electric-sql/pglite@0.5.15`)

**Interfaces:**
- Produces (SQL):
  - `type public.profile_visibility as enum ('public','friends','private')`
  - `public.is_reserved_username(text) returns boolean immutable` (mesma lista de `RESERVED_USERNAMES`)
  - `public.profiles(id uuid pk → auth.users on delete cascade, username text unique, display_name text, bio text, avatar_path text, visibility profile_visibility not null default 'friends', onboarding_completed_at timestamptz, created_at, updated_at)` com checks nomeados `profiles_username_format`, `profiles_username_not_reserved`, `profiles_display_name_length`, `profiles_bio_length`, `profiles_avatar_path_owner` (`avatar_path like id || '/%'`), `profiles_onboarding_fields` (concluído exige username e display_name)
  - `public.profile_private(id uuid pk → auth.users on delete cascade, birthdate date not null)`
  - Trigger `on_auth_user_created` (after insert em `auth.users`) → `public.handle_new_user()` security definer: lê `raw_user_meta_data->>'birthdate'`, recusa ausente, inválida ou < 13 anos (`raise exception`), cria `profiles` e `profile_private`
  - `public.available_usernames(candidates text[]) returns text[]` security definer stable: no máximo 10; devolve, na ordem recebida, os que têm formato válido, não são reservados e estão livres (o @ do próprio usuário conta como livre); execute só para `authenticated`
  - `public.complete_onboarding(p_username text, p_display_name text, p_bio text, p_avatar_path text, p_visibility profile_visibility) returns void` security definer: exige `auth.uid()` (senão `42501`), normaliza (`lower(btrim)`, `btrim`, bio vazia → null), grava e faz `onboarding_completed_at = coalesce(atual, now())`; erros de constraint sobem com o código do Postgres; execute só para `authenticated`
  - RLS: `profiles` select do dono + select de `anon, authenticated` onde `visibility = 'public' and onboarding_completed_at is not null`; nenhum insert/update/delete para `anon`/`authenticated` (revoke + sem policy). `profile_private` select só do dono. Storage: bucket `avatars` público, 2 MB, `image/webp`, `image/jpeg`, `image/png`; insert/update/delete/select de `authenticated` só onde `(storage.foldername(name))[1] = auth.uid()::text`.
- Produces (TS, `tests/db/harness.ts`): `createTestDb(): Promise<TestDb>`; `TestDb.signUp(email: string, birthdate: string | null): Promise<string>` (insere em `auth.users` como o Supabase faria, devolve o id); `TestDb.as<T>(who: string | "anon", fn: (q: Query) => Promise<T>): Promise<T>` (troca papel e claims e volta ao fim); `TestDb.close()`.

- [ ] **Step 1: Escrever stub, harness e os testes que falham**

```ts
// profiles.test.ts (nomes dos testes e asserções principais)
it("cadastro cria perfil vazio e nascimento privado")      // username null, visibility 'friends', completed null
it("cadastro recusa menor de 13, data inválida ou ausente") // signUp rejeita
it("complete_onboarding grava e marca conclusão")           // username 'marcelo.c' (enviado ' Marcelo.C '), completed not null
it("segunda conclusão mantém a data original")
it("@ repetido falha com 23505")
it("@ reservado, nome > 50, bio > 160 e foto fora da própria pasta falham com 23514")
it("anônimo não conclui onboarding: 42501")
it("available_usernames filtra formato, reservados e ocupados; o próprio @ conta como livre; mais de 10 nomes falha")
it("RLS: dono vê o próprio perfil incompleto; outro usuário e anônimo não")
it("RLS: perfil público concluído aparece para anônimo e logados; 'friends' e 'private' não")
it("RLS: anon e authenticated não fazem insert/update/delete em profiles")
it("RLS: profile_private só o dono lê")
it("lista de reservados do SQL é igual a RESERVED_USERNAMES")
// storage.test.ts
it("usuário sobe foto só na própria pasta; na pasta de outro e anônimo falham")
```

- [ ] **Step 2: `npx vitest run tests/db` → FAIL (migração não existe)**
- [ ] **Step 3: Escrever a migração**
- [ ] **Step 4: Rodar de novo → PASS**

### Task 3: Clientes Supabase, regras de rota e proxy

**Files:**
- Modify: `package.json` (deps `@supabase/supabase-js@2.119.0`, `@supabase/ssr@0.12.7`, `server-only`)
- Create: `.env.example`; Modify: `.gitignore` (`!.env.example`)
- Create: `src/lib/supabase/env.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`
- Create: `src/lib/auth/routes.ts`, `src/proxy.ts`
- Test: `tests/unit/routes.test.ts`

**Interfaces:**
- Produces:
  - `getSupabaseEnv(): { url: string; publishableKey: string } | null` (null se faltar variável)
  - `createBrowserSupabase()` (client.ts; lança se não houver env)
  - `createServerSupabase(): Promise<SupabaseClient | null>` (server.ts, `server-only`; `setAll` ignora erro em Server Component)
  - `createAdminSupabase(): SupabaseClient | null` (admin.ts, `server-only`; null sem `SUPABASE_SECRET_KEY`)
  - `PATHS = { login: "/entrar", signup: "/cadastro", onboarding: "/onboarding", home: "/daily" } as const`
  - `routeForRequest(pathname: string, hasSession: boolean): string | null` — `/` → home ou login; `/daily*` e `/onboarding*` sem sessão → `/entrar?next=<pathname>`; `/entrar*` e `/cadastro*` com sessão → home; resto → null
  - `safeNextPath(value: string | null | undefined, fallback: string = PATHS.home): string`
  - `proxy(request: NextRequest)`: renova a sessão com `getClaims()`, aplica `routeForRequest`, copia os cookies renovados para o redirect; sem env → só `routeForRequest(path, false)`. `config.matcher` exclui `_next/static`, `_next/image`, `icon.svg` e arquivos com extensão.

- [ ] **Step 1: Testes que falham**

```ts
expect(routeForRequest("/", true)).toBe("/daily");
expect(routeForRequest("/", false)).toBe("/entrar");
expect(routeForRequest("/daily", false)).toBe("/entrar?next=%2Fdaily");
expect(routeForRequest("/onboarding", false)).toBe("/entrar?next=%2Fonboarding");
expect(routeForRequest("/cadastro", true)).toBe("/daily");
expect(routeForRequest("/termos", false)).toBeNull();
expect(routeForRequest("/auth/confirm", false)).toBeNull();
expect(safeNextPath("/onboarding")).toBe("/onboarding");
for (const bad of ["//site.com", "https://site.com", "/\\site.com", "daily", ""]) {
  expect(safeNextPath(bad)).toBe("/daily");
}
expect(getSupabaseEnv()).toBeNull(); // com process.env sem as variáveis
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Instalar pacotes e implementar** (ler os tipos de `@supabase/ssr` 0.12 em `node_modules` para o formato de `setAll`)
- [ ] **Step 4: Rodar → PASS; `curl -I localhost:3000/daily` → 307 para `/entrar?next=%2Fdaily`**

### Task 4: Cadastro, confirmação de e-mail, login e sair

**Files:**
- Create: `src/lib/auth/errors.ts`, `src/lib/auth/actions.ts` (`"use server"`), `src/app/auth/confirm/route.ts`
- Modify: `src/components/auth/SignupFlow.tsx` (só a etapa de dados + estado "Confira seu e-mail"; sai o passo do @), `src/components/auth/LoginForm.tsx` (chama a action; lê `next` e `erro` da URL via props), `src/app/entrar/page.tsx` (passa `searchParams` dentro de `<Suspense>`)
- Delete: `src/lib/account.ts`
- Test: `tests/unit/auth-errors.test.ts`

**Interfaces:**
- Consumes: `createServerSupabase`, `createAdminSupabase`, `safeNextPath`, `PATHS`, validações da Task 1.
- Produces:
  - `type FormResult<F extends string> = { ok: false; fieldErrors: Partial<Record<F, string>>; formError?: string }`
  - `signUpAction(input: { email: string; password: string; birthdate: string }): Promise<FormResult<"email" | "password" | "birthdate"> | { ok: true; status: "confirm-email"; email: string }>` — valida de novo; `signUp` com `data: { birthdate }` e `emailRedirectTo: <origin>/auth/confirm?next=/onboarding`; com sessão → `redirect("/onboarding")`
  - `signInAction(input: { login: string; password: string; next?: string }): Promise<FormResult<"login" | "password">>` — @ vira e-mail via admin (sem admin → erro no campo: "Entre com seu e-mail por enquanto."); sucesso → `redirect(postLoginPath(onboarded, next))`
  - `signOutAction(): Promise<void>` → `redirect("/entrar")`
  - `mapSignUpError(e: AuthErrorLike)`, `mapSignInError(e: AuthErrorLike)` → `{ field?: string; message: string }`
  - `postLoginPath(onboarded: boolean, next: string | null): string` (sem onboarding → `/onboarding` sempre)
  - `confirmFailurePath(reason: "missing" | "invalid"): string` → `/entrar?erro=link`
  - `GET /auth/confirm`: `token_hash`+`type` → `verifyOtp`; `code` → `exchangeCodeForSession`; sucesso → `safeNextPath(next, "/onboarding")`; falha → `confirmFailurePath`

- [ ] **Step 1: Testes que falham**

```ts
expect(mapSignUpError({ code: "user_already_exists" })).toEqual({ field: "email", message: "Esse e-mail já tem conta. Que tal entrar?" });
expect(mapSignUpError({ code: "weak_password" }).field).toBe("password");
expect(mapSignUpError({ code: "over_email_send_rate_limit" }).field).toBeUndefined();
expect(mapSignInError({ code: "invalid_credentials" })).toEqual({ field: "password", message: "E-mail, @ ou senha incorretos." });
expect(mapSignInError({ code: "email_not_confirmed" }).message).toMatch(/Confirme seu e-mail/);
expect(postLoginPath(false, "/daily")).toBe("/onboarding");
expect(postLoginPath(true, "//site.com")).toBe("/daily");
expect(postLoginPath(true, null)).toBe("/daily");
expect(confirmFailurePath("invalid")).toBe("/entrar?erro=link");
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar errors, actions, rota de confirmação; religar `SignupFlow` e `LoginForm` mantendo o visual (mesmos campos, botões e mensagens por campo)**
- [ ] **Step 4: Rodar testes → PASS; `npx tsc --noEmit` e `npx eslint src` limpos (exceto usos de `UsernameStep`, resolvidos na Task 5)**

### Task 5: Onboarding

**Files:**
- Create: `src/lib/auth/dal.ts` (`server-only`), `src/app/onboarding/page.tsx`
- Create: `src/components/onboarding/OnboardingFlow.tsx`, `ProfileStep.tsx`, `PrivacyStep.tsx`, `useUsernameAvailability.ts`
- Create: `src/components/ui/TextArea.tsx` (mesmo visual do `TextField`, contador `0/160`)
- Create: `src/lib/avatar.ts`, `src/lib/onboarding/actions.ts` (`"use server"`), `src/lib/onboarding/errors.ts`
- Modify: `src/components/auth/UsernameStep.tsx` (vira só apresentação: recebe `availability`, `suggestions`, `kicker`, `onBack?`), `src/components/ui/Avatar.tsx` (`unoptimized` para `blob:`), `next.config.ts` (host do Supabase em `images.remotePatterns`)
- Test: `tests/unit/onboarding.test.ts`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
  - `getCurrentUser(): Promise<{ id: string; email: string } | null>` (React `cache`, `getClaims`)
  - `getMyProfile(): Promise<ProfileRow | null>`
  - `requireOnboardingPending(): Promise<{ user; profile }>` (sem usuário → `/entrar`; concluído → `/daily`)
  - `requireOnboardedProfile(): Promise<ProfileView>` (sem usuário → `/entrar`; pendente → `/onboarding`); `ProfileView = { username; displayName; bio: string | null; avatarUrl: string | null; visibility: Visibility }`
  - `completeOnboardingAction(input: { username; displayName; bio; avatarPath: string | null; visibility }): Promise<{ ok: false; step: 1 | 2 | 3; fieldErrors: Partial<Record<"username" | "displayName" | "bio" | "avatar", string>>; formError?: string }>` → sucesso `redirect("/daily")`
  - `mapOnboardingError(e: { code?: string; message?: string }): { step: 1 | 2 | 3; fieldErrors: …; formError?: string; redirectTo?: string }` (`23505` → passo 1 "Esse @ já está em uso."; `23514` pelo nome da constraint; `42501` → `redirectTo: "/entrar"`)
  - `checkAvatarFile(file: { type: string; size: number }): string | null` (só `image/*`, até 10 MB)
  - `prepareAvatar(file: File): Promise<Blob>` (quadrado 512 px, WebP 0.85; se o navegador devolver PNG, refaz em JPEG)
  - `useUsernameAvailability(username: string): "idle" | "checking" | "available" | "taken" | "error"` (espera 300 ms, ignora respostas velhas)
  - `useAvailableSuggestions(base: string, enabled: boolean): string[]` (até 3, via `available_usernames`)
  - Página: `AuthShell` estático + `<Suspense>` com o conteúdo que chama `requireOnboardingPending()`; foto sobe para `avatars/{uid}/{Date.now()}.{webp|jpg}` antes da action

- [ ] **Step 1: Testes que falham**

```ts
expect(mapOnboardingError({ code: "23505" })).toMatchObject({ step: 1, fieldErrors: { username: "Esse @ já está em uso." } });
expect(mapOnboardingError({ code: "23514", message: 'violates check constraint "profiles_bio_length"' })).toMatchObject({ step: 2, fieldErrors: { bio: expect.any(String) } });
expect(mapOnboardingError({ code: "42501" }).redirectTo).toBe("/entrar");
expect(checkAvatarFile({ type: "application/pdf", size: 1000 })).toBe("Escolha uma imagem (JPG, PNG ou WebP).");
expect(checkAvatarFile({ type: "image/jpeg", size: 11 * 1024 * 1024 })).toBe("Essa foto é grande demais. Escolha uma de até 10 MB.");
expect(checkAvatarFile({ type: "image/png", size: 200_000 })).toBeNull();
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar DAL, página, passos e action** (passo 1 reaproveita `UsernameStep` com kicker "Passo 1 de 3" e sem voltar; passos 2 e 3 com voltar; rodapé "Não é você? Sair")
- [ ] **Step 4: Rodar → PASS; `tsc` e `eslint` limpos**

### Task 6: Área principal `/daily`

**Files:**
- Create: `src/app/daily/page.tsx`, `src/components/daily/DailyHome.tsx` (o atual `AccountReady` adaptado: título `Oi, {primeiro nome}!`, foto, @, link com copiar, privacidade, aviso "O feed do seu daily chega em breve", "Sair" por `<form action={signOutAction}>`)
- Delete: `src/components/auth/AccountReady.tsx`

**Interfaces:**
- Consumes: `requireOnboardedProfile`, `signOutAction`, `displayProfileUrl`, `visibilityLabels`.
- Produces: `DailyHome({ profile }: { profile: ProfileView })`

- [ ] **Step 1: Implementar a página (`AuthShell` + `<Suspense>` com `requireOnboardedProfile()`)**
- [ ] **Step 2: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run` limpos**

### Task 7: Verificação final

- [ ] **Step 1: `npm run build`** → sem erros de prerender (cookies fora de `<Suspense>`)
- [ ] **Step 2: Navegador (script CDP), sem Supabase configurado:** `/entrar` e `/cadastro` abrem iguais aos prints atuais; `/daily` e `/onboarding` → `/entrar?next=…`; cadastro e login mostram o aviso de configuração; nenhum erro no console
- [ ] **Step 3: Com `.env.local` do usuário (se fornecido):** cadastro → (confirmação) → onboarding 3 passos → `/daily`; sair; login com e-mail e com @ → `/daily` direto; `/onboarding` com onboarding feito → `/daily`
- [ ] **Step 4: Relatório:** o que foi feito, arquivos criados/alterados/removidos, como aplicar a migração e configurar o Supabase, pendências
