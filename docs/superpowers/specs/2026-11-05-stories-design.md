# Etapa 03 — Stories (lógica) — spec

## Pedido do usuário (sem edição)

> # ETAPA 03 — FEED NO MODELO SNAPCHAT STORIES
>
> Implemente a lógica de um sistema de Stories inspirado no funcionamento do Snapchat, adaptado à proposta da plataforma Daily.
>
> **IMPORTANTE:** Desenvolver exclusivamente frontend. Não implementar backend, API, Supabase ou banco de dados. Não criar ou modificar interfaces visuais nesta etapa. Trabalhar apenas com lógica, estados, regras de negócio e experiência do usuário.
>
> ## 1. Sistema de Stories
> O usuário deverá conseguir publicar registros rápidos do cotidiano, utilizando fotos e vídeos.
> Cada publicação deverá: pertencer a um usuário; registrar data e horário de publicação; possuir uma mídia; ter uma duração de exibição de 24 horas; possuir configuração de privacidade; ter identificação de visualização.
>
> ## 2. Organização dos Stories
> Exibir Stories de pessoas que o usuário acompanha. Priorizar Stories ainda não visualizados. Separar visualizados e não visualizados. Organizar por atividade mais recente. Agrupar várias publicações do mesmo usuário. Não exibir Stories expirados. Não exibir Stories de usuários bloqueados. Não exibir conteúdos de perfis privados sem autorização.
>
> ## 3. Visualização dos Stories
> Ao abrir um Story: exibição sequencial das publicações; avanço automático após um intervalo de tempo; pausar ao pressionar e segurar; retomar ao soltar; avançar para o próximo Story; voltar para o Story anterior; passar para o próximo usuário; voltar para o usuário anterior; fechar a visualização; marcar como visualizado.
> O tempo de exibição deve ser adequado ao tipo de mídia e não avançar enquanto a mídia estiver carregando.
>
> ## 4. Sistema de visualizações
> Registrar localmente: quais Stories o usuário visualizou; quando visualizou; quais publicações ainda não foram visualizadas.
> Impedir contagens duplicadas da mesma visualização pelo mesmo usuário.
> O proprietário do Story poderá consultar a lista de visualizadores de suas publicações.
>
> ## 5. Expiração de 24 horas
> Cada Story terá seu próprio horário de expiração. A expiração será calculada com base na data de publicação. Stories expirados não poderão aparecer para outros usuários. Stories expirados devem sair da listagem ativa. O proprietário poderá consultar seus Stories expirados em um histórico local, se disponível.
> Não utilizar apenas timers para controlar a expiração. Sempre verificar o horário atual ao carregar e consultar os Stories.
>
> ## 6. Privacidade
> Público: qualquer pessoa pode visualizar, conforme as regras de descoberta. Seguidores: somente seguidores aprovados. Amigos próximos: somente pessoas selecionadas pelo proprietário.
> Respeitar também a privacidade geral do perfil. Bloqueios devem impedir a visualização e interação entre os usuários envolvidos.
>
> ## 7. Interações
> Preparar a lógica para: responder a um Story; curtir um Story; enviar uma reação; compartilhar uma publicação, respeitando a privacidade; denunciar um Story; silenciar Stories de determinado usuário. As respostas devem ser associadas à publicação original.
>
> ## 8. Gerenciamento pelo proprietário
> Consultar seus Stories ativos; consultar visualizações; excluir Stories antes da expiração; consultar histórico de Stories expirados; alterar configurações de privacidade aplicáveis; silenciar ou bloquear pessoas.
>
> ## 9. Estados e UX
> Nenhum Story disponível; Story não visualizado; Story parcialmente visualizado; Story totalmente visualizado; carregamento de mídia; falha ao carregar mídia; Story expirado; Story excluído; usuário sem permissão; falha ao publicar.
> Evitar transições inesperadas, perda de progresso e avanço automático durante carregamentos.
>
> ## 10. Persistência frontend
> Gerenciamento de estado; localStorage para dados persistentes de demonstração; estrutura organizada de dados; funções independentes para criação, visualização, expiração e exclusão. Não utilizar dados fixos como solução definitiva. Preparar a estrutura para futura integração com backend.
>
> ## 11. Restrições
> Não alterar login e cadastro. Não alterar onboarding. Não modificar o sistema de publicação de Dailies já desenvolvido. Não desenvolver backend. Não criar banco de dados. Não implementar funcionalidades fora do escopo. Não copiar a interface do Snapchat.
>
> ## 12. Validação
> Testar: publicação de vários Stories; agrupamento por usuário; avanço e retorno; marcação de visualização; expiração após 24 horas; persistência após atualizar a página; privacidade e bloqueios simulados; exclusão de Stories; falhas de carregamento.
> Ao finalizar, informar os arquivos modificados, funcionalidades implementadas, testes realizados e pendências.
>
> **Objetivo final:** transformar o Daily em uma experiência de acompanhamento espontâneo dos momentos dos amigos, utilizando a dinâmica de Stories do Snapchat, mas mantendo a identidade própria da plataforma.

## Decisões (do Claude; o usuário não opinou nelas)

1. **Sem interface:** nenhum componente visual novo nem tela alterada. A entrega são módulos de lógica (`src/lib/social/`, `src/lib/stories/`) e hooks React prontos para a tela da próxima etapa. O `/daily` continua com "O feed do seu daily chega em breve."
2. **"Sistema de publicação de Dailies já desenvolvido":** não existe no código (só os dumps fictícios de `mock.ts`, que não são tocados). Stories é um módulo novo e separado.
3. **Pessoas:** contas locais (`src/lib/account`) + pessoas extras guardadas no módulo social (para testes e para uma futura demonstração; não fazem login). Leitura das contas sem mudar o módulo de conta.
4. **Relações:** seguir (perfil público → aprovado na hora; perfil privado → pedido pendente até o dono aprovar), aprovar, recusar, deixar de seguir, amigos próximos (lista do dono), bloquear (desfaz o seguir nos dois sentidos; impede ver e interagir), silenciar (some do feed, sem aviso para a outra pessoa).
5. **Privacidade do story:** `public` | `followers` | `close_friends`, padrão `followers`. Regra:
   - o dono sempre vê os próprios (inclusive expirados, no histórico);
   - excluído: ninguém vê; expirado: só o dono;
   - bloqueio em qualquer sentido: não vê;
   - `public` com perfil público: qualquer pessoa; com perfil privado: só seguidores aprovados (o perfil prevalece);
   - `followers`: seguidores aprovados; `close_friends`: só quem está na lista do dono.
6. **Feed:** só de quem a pessoa segue (aprovado), sem silenciados nem bloqueados, sem expirados, excluídos ou denunciados por ela, e só o que ela pode ver. Agrupado por pessoa (stories em ordem de publicação), separado em não vistos (inclui parcialmente vistos) e vistos, cada lista pela atividade mais recente. Os próprios stories vêm à parte.
7. **Tempo de exibição:** foto 5 s; vídeo = duração do arquivo entre 1 s e 60 s; sem duração válida, 10 s. Não conta tempo carregando, com erro, pausado ou com a aba escondida.
8. **Leitor:** máquina de estados pura + hook. Abre no primeiro story não visto da pessoa (retoma o parcial); guarda a lista da abertura (nada muda de lugar enquanto assiste); story que expirou, foi excluído ou perdeu permissão depois da abertura vira estado próprio, sem avanço automático; erro de mídia permite tentar de novo.
9. **Visualização:** uma por pessoa por story (guarda a primeira data), marcada quando a mídia carrega e o story começa a tocar; o dono vendo o próprio não conta; só o dono consulta a lista; some quando o story é excluído.
10. **Expiração:** `expiresAt = createdAt + 24 h`, gravado por story. Toda consulta recebe `now` e filtra; os hooks só reconsultam a cada minuto e ao voltar para a aba.
11. **Interações** (exigem poder ver o story e nenhum bloqueio): responder (1 a 500 caracteres, ligada ao story); curtir (uma por pessoa, alterna, não no próprio); reação (emoji de uma lista; repetir o mesmo não duplica); compartilhar (só se quem recebe também puder ver); denunciar (motivo de uma lista, uma vez por pessoa; some do feed de quem denunciou).
12. **Publicação:** mídia `image` ou `video` com URL `https:`, `http:` ou `data:image/` / `data:video/` (`blob:` é recusado: não sobrevive ao recarregar); legenda opcional até 200; se o localStorage não gravar (cheio), falha e nada fica salvo.
13. **Persistência:** `closie:stories:v1` e `closie:social:v1`, com cópia em memória se o storage estiver bloqueado e evento de mudança para os hooks. A troca por backend é feita nos arquivos `storage.ts`.
14. **Sem dados de demonstração nesta etapa:** sem tela, não há quem os mostre; ficam para a etapa da interface.
