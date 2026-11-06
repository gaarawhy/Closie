# Onboarding (fase 1, front-end) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Depois do cadastro, a pessoa passa por um onboarding de 3 passos (@, perfil, privacidade) e cai na área principal `/daily`; nos próximos logins vai direto para `/daily`. Tudo no front-end, com os dados no navegador.

**Architecture:** `src/lib/account.ts` vira um serviço assíncrono (cadastro, login, sair, sessão, disponibilidade do @, concluir onboarding) com a forma que o backend terá; hoje grava no `localStorage`. As regras de navegação ficam numa função pura (`resolveRoute`) e um `RouteGuard` aplica essas regras nas páginas. As telas novas reaproveitam `AuthShell`, `TextField`, `Button`, `Avatar` e o passo do @ que já existe.

**Tech Stack:** Next.js 16.4.5, React 19.3, Tailwind 4, Vitest 5.1 (novo, só para testes).

**Spec:** `docs/superpowers/specs/2026-11-05-onboarding-supabase-design.md` (seção "Mudança de escopo": fase 1)

## Revisão (05/11/2026, novo pedido do usuário — vale sobre o resto deste plano)

- Task 1: `isVisibility` vira `isProfilePrivacy(value): value is ProfilePrivacy` (`"public" | "private"`), com o tipo em `src/lib/profile.ts` (`DEFAULT_PROFILE_PRIVACY = "private"`, rótulos e descrições).
- Task 2: o serviço vira a pasta `src/lib/account/` (`types.ts`, `storage.ts` só persistência, `service.ts` regras, `useSession.ts`, `index.ts`). `signUp` recebe também `username` (o cadastro continua pedindo o @); `Profile.visibility` vira `Profile.privacy`. Contas no formato antigo (`closie:contas`) são convertidas na leitura, em vez de trocar as chaves.
- Task 4: o cadastro mantém os dois passos (dados → @); só o final muda (vai para o onboarding). Login sem mudança de comportamento; o final vai para `/daily` ou `/onboarding`.
- Task 5: 4 passos — 1 @ (já preenchido com o @ do cadastro: "Confira seu @"), 2 perfil, 3 privacidade (Público ou Privado), 4 revisão com "Editar" por parte e "Concluir". `OnboardingInput.visibility` vira `privacy`.
- Task 6: a área principal mostra a privacidade do perfil e o aviso de sucesso "Perfil pronto!" uma vez depois de concluir.

## Global Constraints

- Só front-end: nada de Supabase, servidor ou banco nesta fase.
- Não alterar o design ou a interface existente sem necessidade.
- Onboarding: username único, nome de exibição, foto opcional, biografia opcional, privacidade inicial.
- Após concluir → `/daily`. Próximos logins → direto para `/daily`, sem repetir o onboarding.
- @: 3 a 20 caracteres, `[a-z0-9._]`, sem ponto no começo/fim, sem `..`; reservados recusados.
- Nome de exibição: 1 a 50 caracteres (depois de `trim`). Bio: até 160. Privacidade: `public` | `friends` | `private`, padrão `friends`.
- Idade mínima: 13 (`MIN_AGE`, já existe).
- Textos em pt-BR informal; cores só por tokens `closie-*`.
- Com `cacheComponents`, nada de `useSearchParams` fora de `<Suspense>`: o `next` da URL é lido de `window.location` dentro de efeito.
- O projeto não é repositório git: "Commit" vira "rodar a verificação da task".

## Review Focus

- Página protegida aberta antes de o navegador ler a sessão (primeira renderização/hidratação) → mostra "carregando", nunca o conteúdo nem um redirecionamento errado para `/entrar`. (Task 7: recarregar `/daily` logado registra só `/daily` no histórico de navegação, sem passar por `/entrar`)
- O @ escolhido é pego por outra conta entre a checagem e o "Concluir" → volta ao passo 1 com "Esse @ já está em uso." (Task 2: `completeOnboarding` com @ tomado)
- Foto que não é imagem ou maior que 10 MB → mensagem no passo 2 e nada é salvo. (Task 5: `checkAvatarFile`)
- `next` malicioso (`//site.com`, `https://site.com`, `/\site.com`) → ignorado. (Task 3: `safeNextPath`)
- Sessão encerrada em outra aba no meio do onboarding → o guard leva para `/entrar` e "Concluir" não grava nada. (Task 2: `completeOnboarding` sem sessão)

---

### Task 1: Vitest e regras compartilhadas

**Files:**
- Modify: `package.json` (devDep `vitest@5.1.0`; script `"test": "vitest run"`)
- Create: `vitest.config.mts` (alias `@` → `src`)
- Modify: `src/lib/validation.ts`, `src/lib/mock.ts` (`mockTakenUsernames = ["ana", "bia", "lua"]`: "contas que já existem" no mundo fictício; os reservados saem dessa lista)
- Test: `tests/unit/validation.test.ts`

**Interfaces:**
- Produces (`src/lib/validation.ts`):
  - `RESERVED_USERNAMES: readonly string[]` — `closie, admin, administrador, suporte, support, ajuda, help, daily, oficial, official, root, sistema, system, api, auth, www, entrar, cadastro, onboarding, termos, privacidade, configuracoes, settings, moderacao, staff`
  - `type UsernameProblem = "empty" | "chars" | "dots" | "short" | "long" | "reserved"`
  - `checkUsernameFormat(username: string): UsernameCheck` (sem "em uso"; reservado vira `"reserved"`, mensagem "Esse @ não está disponível.")
  - `validateUsername(username: string): string | null`
  - `suggestUsernames(base: string): string[]` (até 6, formato válido, sem reservados; quem filtra os livres é o serviço)
  - `DISPLAY_NAME_MAX = 50`, `validateDisplayName(value: string): string | null`
  - `BIO_MAX = 160`, `validateBio(value: string): string | null`
  - `isVisibility(value: unknown): value is Visibility`
  - Mantidos: `normalizeUsername`, `usernameFromEmail`, `validateEmail`, `validatePassword`, `validateBirthdate`, `MIN_AGE`

- [ ] **Step 1: Instalar Vitest, criar config e escrever os testes que falham**

```ts
expect(checkUsernameFormat("admin")).toMatchObject({ ok: false, problem: "reserved" });
expect(checkUsernameFormat("lua")).toEqual({ ok: true });
expect(checkUsernameFormat(".lua").ok).toBe(false);
expect(suggestUsernames("marcelo.coronet")).toEqual(expect.arrayContaining(["marcelo.coronet", "marcelo.daily"]));
expect(suggestUsernames("admin")).not.toContain("admin");
expect(validateDisplayName("   ")).toBe("Diga como você quer ser chamado.");
expect(validateDisplayName("a".repeat(51))).toBe("O nome pode ter no máximo 50 caracteres.");
expect(validateBio("a".repeat(161))).toBe("A bio pode ter no máximo 160 caracteres.");
expect(validateBio("")).toBeNull();
expect(isVisibility("friends")).toBe(true);
expect(isVisibility("everyone")).toBe(false);
expect(validateBirthdate("2013-11-05", new Date(2026, 10, 5))).toBeNull();
expect(validateBirthdate("2013-11-06", new Date(2026, 10, 5))).toMatch(/13 anos/);
```

- [ ] **Step 2: `npx vitest run tests/unit/validation.test.ts` → FAIL**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar → PASS**

### Task 2: Serviço de conta (mock com cara de backend)

**Files:**
- Modify: `src/lib/account.ts` (reescrito; chaves novas `closie:v2:contas` e `closie:v2:sessao`, então contas de teste antigas deixam de valer)
- Test: `tests/unit/account.test.ts` (módulo reimportado a cada teste com `vi.resetModules()`; no Node o serviço cai na cópia em memória)

**Interfaces:**
- Consumes: Task 1.
- Produces (`src/lib/account.ts`):
  - `type Profile = { username: string | null; displayName: string | null; bio: string | null; avatar: string | null; visibility: Visibility; onboardingCompletedAt: string | null }`
  - `type Session = { id: string; email: string; profile: Profile }`
  - `signUp(input: { email: string; password: string; birthdate: string }): Promise<{ ok: true } | { ok: false; field: "email" | "password" | "birthdate"; message: string }>` — valida tudo de novo; cria conta com perfil vazio e `visibility: "friends"`; abre sessão
  - `signIn(login: string, password: string): Promise<boolean>` — e-mail ou @ (com ou sem "@", qualquer caixa)
  - `signOut(): void`
  - `useSession(): Session | null | undefined` — `undefined` enquanto não dá para saber (servidor e hidratação)
  - `isOnboarded(session: Session): boolean`
  - `checkUsernamesAvailable(candidates: string[]): Promise<string[]>` — no máximo 10; devolve, na ordem, os de formato válido que não estão em `mockTakenUsernames` nem em outra conta; o @ da própria sessão conta como livre
  - `type OnboardingInput = { username: string; displayName: string; bio: string; avatar: string | null; visibility: Visibility }`
  - `type OnboardingResult = { ok: true } | { ok: false; step: 1 | 2 | 3; field?: "username" | "displayName" | "bio" | "avatar" | "visibility"; message: string }`
  - `completeOnboarding(input: OnboardingInput): Promise<OnboardingResult>` — exige sessão; valida (@ → passo 1, nome/bio/foto → passo 2, privacidade → passo 3); confere de novo se o @ está livre; grava normalizado (`@` minúsculo, espaços do nome colapsados, bio vazia → `null`); `onboardingCompletedAt` mantém a primeira data
  - Atrasos falsos (600 ms; 250 ms na disponibilidade) zerados quando `NODE_ENV === "test"`

- [ ] **Step 1: Testes que falham**

```ts
it("cadastro cria conta com perfil vazio e já entra")      // session.profile.username === null, visibility "friends", não concluído
it("cadastro recusa e-mail repetido, senha curta e menor de 13")
it("login por e-mail e por @ (com '@' e maiúsculas); senha errada falha")
it("disponibilidade: tira reservados, fictícios, @ de outra conta e formato inválido; o próprio @ é livre; mais de 10 lança erro")
it("concluir grava normalizado e marca conclusão")         // ' Marcelo.C ' → 'marcelo.c'; nome '  Ana   Lu ' → 'Ana Lu'; bio '' → null
it("concluir de novo mantém a primeira data")
it("concluir com @ tomado por outra conta volta ao passo 1")
it("concluir com nome vazio/bio longa → passo 2; privacidade inválida → passo 3")
it("concluir sem sessão não grava e pede login")
it("sair encerra a sessão; entrar de novo traz o perfil concluído")
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar → PASS**

### Task 3: Regras de navegação e `RouteGuard`

**Files:**
- Create: `src/lib/routes.ts`, `src/components/auth/RouteGuard.tsx`
- Test: `tests/unit/routes.test.ts`

**Interfaces:**
- Consumes: `useSession`, `isOnboarded` (Task 2).
- Produces:
  - `PATHS = { login: "/entrar", signup: "/cadastro", onboarding: "/onboarding", home: "/daily" } as const`
  - `resolveRoute(pathname: string, state: { hasSession: boolean; onboarded: boolean }, next?: string | null): string | null` — `/` → home/onboarding/login; `/daily*` sem sessão → `/entrar?next=%2Fdaily`, sem onboarding → `/onboarding`; `/onboarding*` sem sessão → `/entrar?next=%2Fonboarding`, concluído → `/daily`; `/entrar*` e `/cadastro*` com sessão → concluído ? `safeNextPath(next)` : `/onboarding`; resto → `null`
  - `safeNextPath(value: string | null | undefined, fallback: string = PATHS.home): string`
  - `RouteGuard({ mode: "guest" | "protected", children })` — sessão `undefined`: `protected` mostra "Carregando…", `guest` mostra a página; se `resolveRoute` der destino, mostra "Carregando…" e faz `router.replace` (com `next` lido de `window.location.search`)

- [ ] **Step 1: Testes que falham**

```ts
const out = { hasSession: false, onboarded: false };
const pending = { hasSession: true, onboarded: false };
const done = { hasSession: true, onboarded: true };
expect(resolveRoute("/daily", out)).toBe("/entrar?next=%2Fdaily");
expect(resolveRoute("/daily", pending)).toBe("/onboarding");
expect(resolveRoute("/daily", done)).toBeNull();
expect(resolveRoute("/onboarding", out)).toBe("/entrar?next=%2Fonboarding");
expect(resolveRoute("/onboarding", done)).toBe("/daily");
expect(resolveRoute("/onboarding", pending)).toBeNull();
expect(resolveRoute("/entrar", done, "/daily")).toBe("/daily");
expect(resolveRoute("/entrar", pending, "/daily")).toBe("/onboarding");
expect(resolveRoute("/cadastro", out)).toBeNull();
expect(resolveRoute("/termos", done)).toBeNull();
for (const bad of ["//site.com", "https://site.com", "/\\site.com", "daily", ""]) expect(safeNextPath(bad)).toBe("/daily");
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar → PASS**

### Task 4: Cadastro e login religados

**Files:**
- Modify: `src/components/auth/SignupFlow.tsx` (só a etapa de dados; sai o passo do @ e a tela de conta pronta), `src/components/auth/LoginForm.tsx` (sai a tela de conta pronta), `src/app/entrar/page.tsx`, `src/app/cadastro/page.tsx` (`<RouteGuard mode="guest">`)

**Interfaces:**
- Consumes: `signUp`, `signIn` (Task 2), `RouteGuard` (Task 3).
- Produces: nada novo; depois de cadastrar ou entrar, quem navega é o `RouteGuard`.

- [ ] **Step 1: Religar mantendo o visual (mesmos campos, textos, botões e mensagens por campo; botão segue em "Criando conta…" / "Entrando…" até a troca de página)**
- [ ] **Step 2: `npx tsc --noEmit` e `npx eslint src` limpos (exceto `UsernameStep`, ajustado na Task 5)**

### Task 5: Onboarding

**Files:**
- Create: `src/app/onboarding/page.tsx` (título "Seu perfil")
- Create: `src/components/onboarding/OnboardingFlow.tsx`, `StepHeader.tsx`, `ProfileStep.tsx`, `PrivacyStep.tsx`, `useUsernameAvailability.ts`
- Create: `src/components/ui/TextArea.tsx` (visual do `TextField`; rótulo sempre no alto; contador `n/160`)
- Create: `src/lib/avatar.ts`
- Modify: `src/components/auth/UsernameStep.tsx` → mover para `src/components/onboarding/UsernameStep.tsx` e deixar só apresentação; `src/lib/mock.ts` (`visibilityDescriptions`)
- Test: `tests/unit/avatar.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces:
  - `type Availability = "idle" | "checking" | "available" | "taken" | "error"`
  - `useUsernameAvailability(username: string): Availability` (espera 300 ms; resposta velha é ignorada; formato inválido → `"idle"`)
  - `useAvailableSuggestions(base: string, enabled: boolean): string[]` (até 3)
  - `UsernameStep` props: `username, availability, suggestions, kicker, submitLabel, error?, errorKey?, loading, ref?, onChange, onBack?, onSubmit` (mesmo visual; novo estado "Verificando…")
  - `StepHeader({ kicker, title, subtitle, onBack?, headingRef? })`
  - `checkAvatarFile(file: { type: string; size: number }): string | null` (só `image/*`, até 10 MB)
  - `prepareAvatar(file: File): Promise<string>` (quadrado 512 px, WebP 0.85 ou JPEG se o navegador não fizer WebP; devolve data URL)
  - Fluxo: passo 1 "Passo 1 de 3" sem voltar, botão "Continuar" (confere a disponibilidade de novo antes de avançar); passo 2 "Monte seu perfil" (foto, Nome, Bio); passo 3 "Quem vê seus dumps?" (Público, Só amigos, Só eu; padrão Só amigos) com "Concluir"; erro de `completeOnboarding` leva ao passo indicado com a mensagem no campo; rodapé "Não é você? Sair"

- [ ] **Step 1: Teste que falha**

```ts
expect(checkAvatarFile({ type: "application/pdf", size: 1000 })).toBe("Escolha uma imagem (JPG, PNG ou WebP).");
expect(checkAvatarFile({ type: "image/jpeg", size: 11 * 1024 * 1024 })).toBe("Essa foto é grande demais. Escolha uma de até 10 MB.");
expect(checkAvatarFile({ type: "image/png", size: 200_000 })).toBeNull();
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar → PASS; `tsc` e `eslint` limpos**

### Task 6: Área principal `/daily`

**Files:**
- Create: `src/app/daily/page.tsx` (título "Seu daily"), `src/components/daily/DailyHome.tsx` (o `AccountReady` adaptado: foto do perfil, "Oi, {primeiro nome}!", @, link com copiar, privacidade escolhida, aviso "O feed do seu daily chega em breve.", Sair)
- Delete: `src/components/auth/AccountReady.tsx`

- [ ] **Step 1: Implementar com `<RouteGuard mode="protected">`**
- [ ] **Step 2: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run` limpos**

### Task 7: Verificação final

- [ ] **Step 1: `npm run build`** sem erros
- [ ] **Step 2: Fluxo no navegador (script CDP):** cadastro → passo 1 (@ reservado, @ ocupado com sugestões, @ livre) → passo 2 (nome, foto enviada, bio) → passo 3 → `/daily`; recarregar fica em `/daily`; `/onboarding` e `/cadastro` → `/daily`; sair → `/entrar`; `/daily` deslogado → `/entrar?next=%2Fdaily`; entrar com o @ → `/daily` direto; conta com onboarding pela metade → `/onboarding`; celular 390 px; nenhum erro no console
- [ ] **Step 3: Relatório:** o que foi feito, arquivos criados/alterados/removidos, pendências (fase 2 com Supabase)
