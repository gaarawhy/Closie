# Stories (lógica) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lógica completa de Stories (publicar, organizar, assistir, visualizações, expiração, privacidade, interações e gestão pelo dono) sem nenhuma tela, pronta para a interface da próxima etapa.

**Architecture:** Dois módulos de domínio com funções puras que recebem `now` e ids explícitos: `src/lib/social/` (pessoas e relações) e `src/lib/stories/` (stories, regras, feed, visualizações, interações e o leitor como máquina de estados). A persistência fica em `storage.ts` de cada módulo (localStorage + memória); hooks React (`useSyncExternalStore`) expõem tudo para a futura tela.

**Tech Stack:** TypeScript, React 19 (hooks), Vitest 4.1.

**Spec:** `docs/superpowers/specs/2026-11-05-stories-design.md`

## Global Constraints

- Só front-end; nada de backend, API, Supabase ou banco.
- Não criar nem modificar interfaces visuais; não alterar login, cadastro, onboarding nem `mock.ts`.
- Duração de 24 horas por story: `STORY_TTL_MS = 24 * 60 * 60 * 1000`.
- Privacidade do story: `public` | `followers` | `close_friends`; padrão `followers`.
- Foto: `IMAGE_DURATION_MS = 5000`; vídeo: duração do arquivo entre `VIDEO_MIN_MS = 1000` e `VIDEO_MAX_MS = 60000`, sem duração válida `VIDEO_FALLBACK_MS = 10000`.
- Legenda até 200 caracteres; resposta de 1 a 500.
- Toda função que depende de tempo recebe `now: number` (padrão `Date.now()`); nenhuma regra depende de timer.
- Chaves: `closie:stories:v1`, `closie:social:v1`.
- O projeto não é repositório git: "Commit" vira "rodar a verificação da task".

## Review Focus

- Story expira (ou é excluído) com o leitor aberto nele → estado `expired`/`deleted`, sem tocar nem contar visualização. (Task 2: `unavailableReason` com `now` depois de `expiresAt`)
- localStorage cheio ao publicar → falha `storage` e nada salvo pela metade. (Task 2: `publishStory` com `setItem` lançando)
- JSON corrompido no localStorage → estado vazio, nada quebra. (Tasks 1 e 2: carregar com `"{"` gravado)
- Vídeo sem duração nos metadados (`NaN`, `Infinity`) → 10 s, sem travar. (Task 5: `durationFor`)
- Segurar o dedo enquanto a mídia carrega → ao carregar fica pausado até soltar. (Task 5: `hold` antes de `media_loaded`)

---

### Task 1: Pessoas e relações (`src/lib/social`)

**Files:**
- Create: `src/lib/social/types.ts`, `storage.ts`, `directory.ts`, `graph.ts`, `index.ts`
- Test: `tests/unit/social.test.ts`

**Interfaces:**
- Produces:
  - `type Person = { id: string; username: string; displayName: string | null; avatar: string | null; privacy: ProfilePrivacy }`
  - `getPerson(id: string): Person | null` (contas locais primeiro, depois pessoas extras); `addPerson(person: Person): void`
  - `follow(followerId: string, targetId: string, now?: number): "approved" | "pending" | "blocked" | "self"`
  - `approveFollow(ownerId, followerId): boolean`, `rejectFollow(ownerId, followerId): boolean`, `unfollow(followerId, targetId): void`
  - `pendingFollowRequests(ownerId): string[]`, `followingIds(viewerId): string[]` (só aprovados)
  - `isApprovedFollower(viewerId, ownerId): boolean`
  - `setCloseFriends(ownerId, ids: string[]): void`, `getCloseFriends(ownerId): string[]`, `isCloseFriend(viewerId, ownerId): boolean`
  - `block(blockerId, blockedId, now?)`, `unblock(blockerId, blockedId)`, `isBlockedEitherWay(a, b): boolean`, `blockedIds(userId): string[]`
  - `mute(userId, targetId, now?)`, `unmute(userId, targetId)`, `isMuted(userId, targetId): boolean`
  - `subscribeSocial(cb): () => void`, `socialSnapshot(): string`

- [ ] **Step 1: Testes que falham** (localStorage em memória novo + `vi.resetModules()` a cada teste, como em `account.test.ts`)

```ts
it("seguir perfil público é aprovado na hora; privado fica pendente até aprovar")
// follow(a, pub) === "approved"; follow(a, priv) === "pending"; isApprovedFollower(a, priv) === false
// approveFollow(priv, a) === true → isApprovedFollower(a, priv) === true; pendingFollowRequests(priv) === []
it("recusar remove o pedido; deixar de seguir remove a aprovação")
it("bloquear desfaz o seguir nos dois sentidos e impede seguir de novo")
// follow(b, a) === "blocked"; isBlockedEitherWay(a, b) && isBlockedEitherWay(b, a)
it("amigos próximos são só os escolhidos pelo dono; sem repetição e sem o próprio dono")
it("silenciar não afeta o seguir")
it("getPerson acha conta local e pessoa extra; id desconhecido → null")
it("persiste após recarregar o módulo (simula atualizar a página)")
it("JSON corrompido no storage → estado vazio, sem erro")
```

- [ ] **Step 2: `npx vitest run tests/unit/social.test.ts` → FAIL (módulo não existe)**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar → PASS**

### Task 2: Núcleo dos stories — publicar, acesso, expirar, excluir

**Files:**
- Create: `src/lib/stories/types.ts`, `constants.ts`, `storage.ts`, `access.ts`, `publish.ts`
- Test: `tests/unit/stories-core.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `type StoryMedia = { type: "image" | "video"; url: string }`; `type StoryPrivacy = "public" | "followers" | "close_friends"`
  - `type Story = { id; ownerId; media: StoryMedia; caption: string | null; privacy: StoryPrivacy; createdAt: string; expiresAt: string; deletedAt: string | null }`
  - `type PublishResult = { ok: true; story: Story } | { ok: false; reason: "invalid_media" | "invalid_caption" | "invalid_privacy" | "no_owner" | "storage"; message: string }`
  - `publishStory(input: { ownerId: string; media: StoryMedia; caption?: string; privacy?: StoryPrivacy }, now?: number): PublishResult`
  - `deleteStory(storyId, ownerId, now?): { ok: true } | { ok: false; reason: "not_found" | "forbidden" }`
  - `updateStoryPrivacy(storyId, ownerId, privacy, now?): { ok: true } | { ok: false; reason: "not_found" | "forbidden" | "expired" | "invalid_privacy" }`
  - `getStory(id): Story | null`; `isExpired(story, now): boolean`
  - `type Unavailable = "deleted" | "expired" | "blocked" | "forbidden"`
  - `unavailableReason(viewerId: string, story: Story, now: number): Unavailable | null`; `canViewStory(viewerId, story, now): boolean`
  - `subscribeStories(cb)`, `storiesSnapshot(): string`

- [ ] **Step 1: Testes que falham**

```ts
it("publica com dono, data, mídia, privacidade e expiração em 24 h")
// expiresAt - createdAt === 24 * 60 * 60 * 1000; privacy padrão "followers"
it("recusa mídia ausente, tipo inválido, URL blob: e legenda > 200")
it("localStorage cheio → falha 'storage' e nada salvo")
it("expira exatamente em 24 h: 23h59 visível, 24h00 não (para os outros); o dono continua vendo")
it("story expirado/excluído aberto agora → unavailableReason 'expired'/'deleted'")
it("privacidade: public+perfil público = todos; public+perfil privado = só aprovados; followers = aprovados (pendente não); close_friends = só a lista")
it("bloqueio em qualquer sentido → 'blocked'")
it("excluir: só o dono; some para todos")
it("mudar privacidade: só o dono e só de story ativo")
it("persiste após recarregar o módulo; JSON corrompido → vazio")
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar** (gravação devolve `boolean`; `publishStory` só confirma se gravou)
- [ ] **Step 4: Rodar → PASS**

### Task 3: Feed, visualizações e consultas do dono

**Files:**
- Create: `src/lib/stories/feed.ts`, `views.ts`
- Test: `tests/unit/stories-feed.test.ts`

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces:
  - `type FeedGroup = { owner: Person; stories: Story[]; seenIds: string[]; status: "unseen" | "partial" | "seen"; startIndex: number; latestAt: string }`
  - `buildStoriesFeed(viewerId: string, now?: number): { unseen: FeedGroup[]; seen: FeedGroup[]; mine: FeedGroup | null; isEmpty: boolean }`
  - `markStoryViewed(storyId, viewerId, now?): { ok: true; counted: boolean } | { ok: false; reason: Unavailable | "not_found" }`
  - `hasViewed(storyId, viewerId): boolean`
  - `getStoryViewers(storyId, requesterId): { ok: true; viewers: { viewerId: string; viewedAt: string }[] } | { ok: false; reason: "not_found" | "forbidden" }`
  - `getMyActiveStories(ownerId, now?): Story[]`, `getMyExpiredStories(ownerId, now?): Story[]`

- [ ] **Step 1: Testes que falham**

```ts
it("agrupa vários stories da mesma pessoa em ordem de publicação")
it("só mostra quem a pessoa segue (aprovado), sem silenciados, bloqueados, expirados ou excluídos")
it("não vistos primeiro, vistos separados; cada lista pela atividade mais recente")
it("parcial: status 'partial' e startIndex no primeiro não visto")
it("visualização conta uma vez (mesmo em duas chamadas); o dono vendo o próprio não conta")
it("só o dono vê a lista de visualizadores, mais recentes primeiro")
it("dono: ativos e histórico de expirados separados; excluídos fora dos dois")
it("feed vazio → isEmpty true")
it("visualizações persistem após recarregar o módulo")
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar → PASS**

### Task 4: Interações

**Files:**
- Create: `src/lib/stories/interactions.ts`
- Test: `tests/unit/stories-interactions.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces (todas devolvem `{ ok: true, ... } | { ok: false; reason: Unavailable | "not_found" | "invalid" | "own_story" }`):
  - `STORY_REACTIONS = ["❤️", "😂", "😮", "😢", "🔥", "👏"] as const`; `REPORT_REASONS = ["spam", "nudez", "violencia", "assedio", "outro"] as const`
  - `replyToStory(storyId, fromId, text, now?)` → `{ ok: true; reply: StoryReply }`; `getStoryReplies(storyId, requesterId)` (só o dono)
  - `toggleStoryLike(storyId, userId, now?)` → `{ ok: true; liked: boolean }`; `getStoryLikes(storyId, requesterId)` (só o dono)
  - `sendStoryReaction(storyId, userId, emoji, now?)` → `{ ok: true; added: boolean }`
  - `shareStory(storyId, fromId, toId, now?)` → `{ ok: true }` só se `toId` também puder ver
  - `reportStory(storyId, reporterId, reason, now?)` → `{ ok: true; added: boolean }`; denunciado some do feed de quem denunciou

- [ ] **Step 1: Testes que falham**

```ts
it("resposta fica ligada ao story e só o dono lista; texto vazio ou > 500 é recusado")
it("bloqueado não responde, não curte, não reage, não compartilha")
it("curtir alterna e não duplica; não curte o próprio")
it("reação repetida não duplica; emoji fora da lista é recusado")
it("compartilhar respeita a privacidade de quem recebe")
it("denúncia conta uma vez e tira o story do feed de quem denunciou")
it("sem permissão de ver → 'forbidden' em todas")
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar → PASS**

### Task 5: Leitor (máquina de estados pura)

**Files:**
- Create: `src/lib/stories/viewer.ts`
- Test: `tests/unit/stories-viewer.test.ts`

**Interfaces:**
- Consumes: `StoryMedia`, constantes (Task 2).
- Produces:
  - `type ViewerGroupRef = { ownerId: string; storyIds: string[]; startIndex: number }`
  - `type ViewerStatus = "loading" | "playing" | "paused" | "error" | "finished" | "closed"`
  - `type ViewerState = { groups: ViewerGroupRef[]; groupIndex: number; storyIndex: number; status: ViewerStatus; elapsedMs: number; durationMs: number | null; held: boolean; hidden: boolean }`
  - `type ViewerAction = { type: "media_loaded"; durationMs: number } | { type: "media_error" } | { type: "retry" } | { type: "tick"; deltaMs: number } | { type: "hold" } | { type: "release" } | { type: "visibility"; hidden: boolean } | { type: "next_story" } | { type: "prev_story" } | { type: "next_user" } | { type: "prev_user" } | { type: "close" }`
  - `createViewer(groups: ViewerGroupRef[], groupIndex: number): ViewerState` (começa em `groups[groupIndex].startIndex`, `loading`)
  - `viewerReducer(state, action): ViewerState`
  - `durationFor(media: StoryMedia, metadataSeconds?: number): number`
  - `currentStoryId(state): string | null`; `segmentProgress(state): number[]`

- [ ] **Step 1: Testes que falham**

```ts
it("abre no primeiro não visto da pessoa escolhida, carregando")
it("carregando não avança com tick; carregou → toca e avança sozinho no fim da duração")
it("durationFor: foto 5000; vídeo 7.5 s → 7500; 0.2 s → 1000; 90 s → 60000; NaN/Infinity/undefined → 10000")
it("segurar pausa e soltar retoma sem perder o progresso")
it("segurar durante o carregamento → carrega pausado até soltar")
it("aba escondida pausa; voltar retoma (se não estiver segurando)")
it("próximo/anterior story e próxima/anterior pessoa, inclusive nas bordas")
// prev_story no 1º story → último story da pessoa anterior; na 1ª pessoa → recomeça
// next_story no último story da última pessoa → finished
it("erro de mídia não avança; tentar de novo volta a carregar")
it("fechado/terminado ignora outras ações")
it("segmentProgress: 1 nos anteriores, fração no atual, 0 nos seguintes")
```

- [ ] **Step 2: Rodar → FAIL**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Rodar → PASS**

### Task 6: Hooks para a futura tela

**Files:**
- Create: `src/lib/stories/clock.ts` (`useNow(intervalMs)` com `useSyncExternalStore`), `src/lib/stories/hooks.ts` (`"use client"`), `src/lib/stories/index.ts`

**Interfaces:**
- Consumes: Tasks 1–5, `useSession`.
- Produces:
  - `useStoriesFeed(): { loading: boolean; unseen: FeedGroup[]; seen: FeedGroup[]; mine: FeedGroup | null; isEmpty: boolean }` (reconsulta a cada 60 s e quando o storage muda)
  - `useMyStories(): { active: Story[]; expired: Story[] }`
  - `useStoryViewer(viewerId: string, groups: ViewerGroupRef[], startGroupIndex: number)` → `{ status: ViewerStatus | Unavailable; story: Story | null; owner: Person | null; progress: number[]; onMediaLoad(metadataSeconds?: number): void; onMediaError(): void; retry(): void; hold(): void; release(): void; nextStory(): void; prevStory(): void; nextUser(): void; prevUser(): void; close(): void }` — lista guardada na abertura; avanço por `requestAnimationFrame` só em `playing`; marca visualização quando começa a tocar; `unavailableReason` calculado na renderização com o relógio de 1 s

- [ ] **Step 1: Implementar** (sem teste unitário: não há biblioteca de teste de componentes; a lógica que os hooks usam já está coberta nas Tasks 1–5)
- [ ] **Step 2: `npx tsc --noEmit`, `npx eslint src tests`, `npx vitest run` e `npm run build` limpos**

### Task 7: Verificação e relatório

- [ ] **Step 1: Suíte inteira, build, e conferir que nenhuma tela mudou** (`diff` das pastas `src/app` e `src/components` contra o estado anterior: sem diferença)
- [ ] **Step 2: Relatório:** arquivos, funcionalidades, testes, pendências (tela da próxima etapa, dados de demonstração, backend)
