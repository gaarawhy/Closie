# Onboarding pós-cadastro com Supabase — spec

## Pedido original (texto do usuário, sem edição)

> Implemente a primeira etapa pós-cadastro da plataforma Daily: onboarding e configuração inicial do perfil.
>
> Desenvolva toda a lógica de negócio, integração com o banco de dados, validações, autenticação e regras de navegação.
>
> Não altere o design ou a interface existente sem necessidade.
>
> O usuário deverá configurar username único, nome de exibição, foto opcional, biografia opcional e privacidade inicial do perfil.
>
> Implemente validação de disponibilidade do username, persistência dos dados, controle de conclusão do onboarding e proteção das rotas.
>
> Após concluir, o usuário deverá ser direcionado para a área principal. Nos próximos logins, deverá entrar diretamente, sem repetir o onboarding.
>
> Verifique também as permissões de acesso e a segurança dos dados utilizando as políticas adequadas do Supabase RLS.
>
> Ao finalizar, teste os fluxos e informe exatamente o que foi implementado, quais arquivos foram alterados e se existem pendências.

## Pedido atualizado do usuário (05/11/2026) — spec que vale para a fase 1

> Implemente exclusivamente no frontend a etapa de onboarding da plataforma Daily, exibida após o usuário concluir o cadastro.
>
> Não desenvolva backend, API, Supabase ou banco de dados.
>
> ### Funcionalidades
>
> 1. Escolher um nome de usuário (@username).
> 2. Definir nome de exibição.
> 3. Adicionar foto de perfil.
> 4. Escrever uma biografia opcional.
> 5. Escolher entre perfil público ou privado.
> 6. Validar campos obrigatórios.
> 7. Validar formato do username.
> 8. Simular verificação de disponibilidade do username no frontend.
> 9. Permitir avançar e voltar entre as etapas.
> 10. Exibir feedback de erros e sucesso.
>
> ### Regras de UX
>
> - O processo deve ser rápido e intuitivo.
> - Campos opcionais devem poder ser ignorados.
> - O usuário deve conseguir visualizar suas informações antes de concluir.
> - Não permitir finalizar sem preencher os campos obrigatórios.
> - Após concluir, direcionar o usuário para a área principal da plataforma.
> - Não repetir o onboarding durante a navegação da sessão.
>
> ### Persistência temporária
>
> Utilize o estado da aplicação e localStorage para simular a persistência das informações.
>
> Organize o código para que futuramente seja possível substituir essa persistência por uma API real sem reescrever toda a lógica.
>
> ### Restrições
>
> - Não criar backend.
> - Não criar endpoints.
> - Não conectar Supabase.
> - Não alterar funcionalidades existentes de login e cadastro.
> - Não implementar funcionalidades fora desta etapa.

**Decisões para este pedido (do Claude):**

- **Cadastro e login ficam como estão** (o cadastro continua pedindo e-mail, senha, nascimento e o @). Muda só o que acontece no fim: em vez da tela "Conta criada!", a pessoa vai para o onboarding; depois do login, vai para `/daily` ou, se o onboarding ficou pela metade, para `/onboarding`.
- **Passo 1 do onboarding é o @**, já preenchido com o @ escolhido no cadastro ("Confira seu @": manter ou trocar). Assim o onboarding cumpre o item 1 sem mexer no cadastro. Se depois quiserem tirar o @ do cadastro, basta remover aquele passo.
- **Passos:** 1 @ → 2 perfil (nome obrigatório, foto e bio opcionais) → 3 privacidade (Público ou Privado; vem marcado **Privado**, combina com "só pra quem você escolhe") → 4 revisão (resumo com "Editar" em cada parte e "Concluir").
- **Foto é opcional** (o pedido anterior dizia "foto opcional" e a regra de UX manda deixar os opcionais serem ignorados).
- **Privacidade do perfil** é um tipo novo (`public` | `private`), separado da visibilidade dos dumps que já existe no mock (`public` | `friends` | `private`).
- **Sucesso:** "Esse @ está livre!" no passo 1 e, ao concluir, aviso "Perfil pronto!" na área principal.
- **Persistência:** regras de negócio em `src/lib/account/service.ts`; leitura e gravação isoladas em `src/lib/account/storage.ts` (`localStorage`). Para ligar uma API, troca-se o `storage.ts` (ou o `service.ts` inteiro) sem mexer nas telas, que só importam de `@/lib/account`.
- **Contas de teste antigas** do navegador continuam entrando (o formato antigo é convertido na leitura) e caem no onboarding.

## Mudança de escopo (05/11/2026, pedido do usuário)

> "n faz esse negocio do supa base agora nao apenas o frotn end ok vamos deixa o supa para o back end"

**Agora (fase 1, front-end):** telas e regras do onboarding, navegação e controle de conclusão, usando os dados no navegador (`localStorage`, como o mock atual). Toda leitura e gravação passa por funções assíncronas em `src/lib/account.ts` com a mesma forma que o backend terá, para trocar pelo Supabase depois sem mexer nas telas. A disponibilidade do @ é simulada (contas deste navegador + nomes fictícios + reservados).

**Depois (fase 2, backend):** as decisões 1, 3, 5, 7, 8, 9, 10, 12 e 13 abaixo (Supabase Auth, confirmação de e-mail, função `complete_onboarding`, login com @ pelo servidor, tabela privada do nascimento, RLS, `available_usernames`, proxy e aviso de configuração) ficam registradas aqui para essa fase. Na fase 1, a proteção de rotas é feita no navegador, porque a sessão mock só existe lá.

## Estado atual

- Next.js 16.4.5 (App Router, `cacheComponents: true`), React 19.3, Tailwind 4, fonte Sora.
- `/entrar` (login e-mail ou @ + senha) e `/cadastro` (e-mail, senha, nascimento 13+ → escolha do @ estilo VSCO) já desenhados.
- Não existe backend: contas e sessão vivem no `localStorage` (`src/lib/account.ts`). Não há Supabase, `.env` nem Docker na máquina.

## Decisões (todas do Claude; o usuário não opinou nelas)

1. **Auth:** Supabase Auth com e-mail e senha, via server actions e `@supabase/ssr` (sessão em cookies). A sessão é renovada em `src/proxy.ts` (no Next 16 o middleware se chama proxy).
2. **Cadastro:** a tela atual (e-mail, senha, nascimento) cria a conta. A escolha do @ sai do cadastro e vira o passo 1 do onboarding, com o mesmo visual.
3. **Confirmação de e-mail:** suportada. Se o projeto exigir confirmação (padrão do Supabase hospedado), o cartão mostra "Confira seu e-mail"; o link volta para `/auth/confirm`, que aceita `code` (template padrão) e `token_hash` (template recomendado para SSR) e segue para o onboarding.
4. **Onboarding (`/onboarding`) em 3 passos, um cartão por passo, no mesmo estilo das telas atuais:**
   1. Escolha do @ (componente atual, disponibilidade checada no banco enquanto digita).
   2. Perfil: nome de exibição (obrigatório, até 50), foto (opcional), bio (opcional, até 160).
   3. Privacidade: Público, Só amigos (padrão, já é o padrão do mock) ou Só eu.
5. **Conclusão atômica:** uma função no banco (`complete_onboarding`) valida e grava tudo de uma vez e marca `onboarding_completed_at`. Concorrência no @ é resolvida pelo índice único (quem chegar depois volta ao passo 1 com "Esse @ já está em uso").
6. **Área principal provisória (`/daily`):** cartão com foto, nome, @, link `closie.co/@nome` com copiar, privacidade e "Sair". O feed do daily ainda não foi desenhado e fica para a próxima etapa.
7. **Login com @:** mantido (a tela diz "E-mail ou @"). O servidor troca o @ pelo e-mail com a chave secreta do Supabase; o e-mail nunca vai para o navegador. Sem a chave secreta configurada, o login com @ pede o e-mail.
8. **Nascimento:** fica numa tabela privada (`profile_private`), que só o dono lê. A regra dos 13 anos é checada no navegador, na server action e no banco (trigger do cadastro).
9. **RLS:**
   - `profiles`: o dono lê o próprio perfil; qualquer pessoa (logada ou não) lê só perfis **públicos com onboarding concluído**. Perfis "Só amigos" e "Só eu" ficam fechados até existir a regra de amizade. Ninguém insere, altera ou apaga direto: só o trigger do cadastro e a função `complete_onboarding`.
   - `profile_private`: só o dono lê.
   - Storage `avatars`: leitura pública (foto de perfil), escrita e remoção só na pasta `{id do usuário}/`.
10. **Disponibilidade do @:** função `available_usernames(text[])` (até 10 nomes por chamada) que devolve só os que têm formato válido, não são reservados e estão livres. Serve para o campo e para as sugestões.
11. **Foto:** o navegador recorta em quadrado de 512 px e converte para WebP (ou JPEG) antes de subir; o bucket aceita até 2 MB e só imagens.
12. **Proteção de rotas:** o proxy faz a checagem otimista (sem sessão → `/entrar?next=…`; com sessão em `/entrar` ou `/cadastro` → `/daily`); as páginas fazem a checagem de verdade no servidor (sem onboarding → `/onboarding`; onboarding feito → não volta mais para `/onboarding`).
13. **Sem Supabase configurado:** as páginas públicas continuam abrindo; cadastro e login mostram um aviso de configuração em vez de quebrar.

## Fora do escopo

Feed do daily, amizades, editar perfil depois do onboarding, recuperar senha, login com Google, página pública `closie.co/@nome`.

## Restrições

- Não mudar o visual existente sem necessidade.
- Next 16 com Cache Components: `cookies()` só dentro de `<Suspense>`; middleware é `src/proxy.ts`.
- Sem Docker: banco e RLS testados com PGlite (Postgres real em WASM) com um esqueleto dos schemas `auth` e `storage` do Supabase.
