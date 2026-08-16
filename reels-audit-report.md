# Auditoria da aba Reels — TeleFans

**Data:** 15 de Agosto de 2026  
**Ambiente:** `https://telefans.pages.dev/reels` e código local em `/home/ubuntu/telefans`  
**Escopo:** apenas diagnóstico; nenhuma correcção de código foi aplicada.

## Resumo executivo

A aba Reels carrega e reproduz vídeos, mas actualmente funciona como uma lista visual de vídeos, não como uma feed data-driven completa. Os problemas mais importantes são: as tabs **Trending** e **New** não têm lógica diferente; os contadores de likes e comentários não correspondem ao Supabase; vários conteúdos têm interacções desactivadas; a partilha não usa o fluxo nativo desejado do Telegram; e todos os vídeos são montados simultaneamente, o que pode causar travamentos, consumo excessivo de rede e concorrência entre reproduções.

## Problemas confirmados

| Prioridade | Problema | Evidência | Impacto |
|---|---|---|---|
| Crítica | **Trending e New são apenas visuais** | `tab` só é usado em `activeTab`; `listPublishedReels()` faz sempre a mesma query por `created_at desc` | As duas abas entregam a mesma feed e não cumprem a função esperada |
| Crítica | **Contadores não são reais** | `remoteVideos` recebe `likes: '0'`, `comments: '0'`, `shares: '0'`; `baseReels` usa strings hardcoded | O utilizador vê números falsos ou sempre zero |
| Alta | **Likes só funcionam para posts persistidos** | `onLike` só é fornecido quando `reel.persisted` é verdadeiro; conteúdos base e vídeos locais não persistem likes | O botão aparece mas não tem efeito em parte da feed |
| Alta | **Comentários não actualizam a contagem** | Depois de `addPostComment`, o estado local da lista muda, mas `reel.comments` permanece igual | O painel mostra o comentário, mas o contador do cartão continua errado |
| Alta | **Comentários ignoram `comments_enabled`** | A query não selecciona/valida essa propriedade antes de abrir ou gravar | Pode permitir comentários onde o administrador os desactivou |
| Alta | **Partilha não segue o fluxo nativo do Telegram** | `shareReel()` usa `navigator.share()` ou clipboard e gera URL `/reels#id` | No Mini App, pode abrir a partilha externa do sistema em vez da partilha nativa no Telegram |
| Alta | **Sem rastreamento de visualizações** | `recordPostView()` existe no helper, mas nunca é importado nem chamado na rota | O algoritmo não recebe sinais de visualização e não há base para ranking real |
| Alta | **Vídeos locais não têm poster** | `localVideos` define `thumbnail: ''` | Enquanto carregam, aparecem frames pretos ou transições abruptas |
| Alta | **Slug pode ficar vazio** | Se um post remoto não encontrar o creator em `creatorMap`, recebe `slug: ''` | O clique no nome/avatar pode conduzir a uma rota inválida |
| Média | **Estado inicial mostra conteúdo antigo antes da resposta do backend** | `feed` começa com `baseReels` e só depois substitui os dados | Pode haver flash de conteúdo errado, duplicação e percepção de carregamento instável |
| Média | **Erros de carregamento são silenciados** | O `catch` troca silenciosamente para conteúdo local/base | O utilizador não sabe que o backend falhou e pode interpretar dados incompletos como reais |
| Média | **Não há estado de loading, vazio ou erro** | A rota renderiza directamente a lista; não existem estados explícitos | A experiência fica ambígua quando não existem reels publicados |

## Reprodução, áudio e performance

| Prioridade | Problema | Evidência | Impacto |
|---|---|---|---|
| Crítica | **Todos os vídeos são montados ao mesmo tempo** | O HTML capturado renderizou 29 `.reel-card`, 29 `.reel-tabs` e 29 `.reel-actions`; cada cartão contém o seu próprio `<video>` | Elevado uso de memória, pedidos simultâneos e risco de travamentos em telemóveis |
| Alta | **Cada cartão cria um IntersectionObserver próprio** | O componente `Reel` cria um observer por vídeo | Custo desnecessário e maior probabilidade de disputas de estado |
| Alta | **Há duas rotinas que tentam iniciar/parar o vídeo** | O observer chama `play()` e o efeito de `active` também chama `play()`/`pause()` | Pode haver race conditions, estados `paused` inconsistentes e vídeo a desaparecer/parar ao tocar |
| Alta | **Autoplay com áudio não é robusto** | O código define `muted = false` antes de `play()` e captura a rejeição apenas como `paused` | Clientes móveis podem bloquear autoplay com áudio; o vídeo fica parado sem uma recuperação clara por gesto do utilizador |
| Média | **Preload de todos os vídeos** | Cada `<video>` usa `preload="metadata"` e todos estão no DOM | Mesmo sem reprodução, muitos ficheiros podem iniciar pedidos de metadata e aumentar o atraso |
| Média | **Não existe gestão de erro de media** | Não há `onError`, fallback de poster ou mensagem quando o vídeo falha | Links expirados, formatos incompatíveis ou falhas de rede deixam um cartão aparentemente vazio |
| Média | **Não existe contagem/limite de vídeos activos** | Apenas o observer controla reprodução, sem um gestor centralizado | Pode haver mais de um vídeo activo durante transições de scroll |

## Layout e interacção visual

| Prioridade | Problema | Evidência | Impacto |
|---|---|---|---|
| Alta | **Tabs repetidas em todos os cartões** | `reel-tabs` é renderizado dentro de cada `Reel` | O mesmo Trending/New aparece repetidamente ao longo da rolagem, em vez de ser uma navegação da feed |
| Média | **Tabs podem ficar demasiado próximas do chrome nativo** | `.reel-tabs` tem `top: 22px` e a feed também recebe padding de safe-area | Em alguns contextos Telegram, o topo pode ficar comprimido ou sobreposto |
| Média | **Bottom navigation sobrepõe o conteúdo** | `.bottom-nav` é `position: fixed`; a legenda usa `bottom: 112px` e o cartão continua em altura total | Pode cobrir conteúdo ou acções em ecrãs com safe-area diferente |
| Média | **Altura da feed é recalculada de forma sobreposta** | `.reels-feed` e `.reel-card` recebem `100dvh` e depois `calc(100dvh - safe-area)`, enquanto `.reels-shell` também tem padding-top | Pode produzir scroll extra, cortes ou áreas fora do viewport em diferentes clientes |
| Baixa | **Botão de play só aparece com hover/focus** | A regra principal define opacity 0 e mostra-o em `:hover`/`:focus-within` | Em touch, o estado de pausa/reprodução pode não ser evidente antes do toque |

## Dados e ranking

A query actual ordena tudo por `created_at desc`, mas não implementa qualquer ranking por likes, comentários, visualizações ou actividade. Além disso, os likes usam `visitor_key` guardado no `localStorage`, não a identidade Telegram já disponível no Mini App. Isso torna a métrica anónima por dispositivo/browser e não ligada ao utilizador autenticado.

Os vídeos carregados pelo dashboard local são misturados com vídeos remotos, mas recebem `persisted: false` e contadores zero. Os vídeos base da aplicação também continuam a ser injectados como fallback. A feed pode, portanto, conter três fontes de dados com comportamentos diferentes, sem indicação visual da origem ou consistência nas interacções.

## Ordem recomendada de correcção

1. Separar a navegação da feed dos cartões e implementar de facto os modos **Trending** e **New**.
2. Criar uma consulta/agregação real para contagens de likes, comentários e visualizações, mantendo optimismo no like e actualização imediata dos contadores.
3. Centralizar a reprodução num único gestor de vídeo activo, montar apenas uma janela de cartões à volta do item visível e tratar autoplay/áudio com fallback explícito.
4. Corrigir o partilhar para o mecanismo nativo do Telegram Mini App, sem `navigator.share` como caminho principal.
5. Respeitar `comments_enabled`, registar visualizações e separar estados de loading, vazio e erro.
6. Remover a repetição das tabs e recalibrar safe-area, altura da feed e navegação inferior para a referência mobile de 391 px.

## Conclusão

O problema não é um único detalhe de CSS. A aba precisa de uma correcção coordenada em **modelo de dados, ranking, reprodução, contadores, partilha e composição mobile**. Recomendo corrigir primeiro a arquitectura funcional e a reprodução; só depois fazer o ajuste final de pixel-perfect, para evitar que alterações visuais sejam novamente invalidadas por mudanças no fluxo de dados.

## Segunda auditoria após a correcção

A segunda auditoria foi feita no deployment `https://12a829e4.telefans.pages.dev` e na URL principal `https://telefans.pages.dev`.

| Verificação | Resultado |
|---|---|
| Build de produção | Passou; prerender de `/reels`, `?tab=trending` e `?tab=new` concluído. |
| TypeScript | Passou com `tsc --noEmit`. |
| URL principal | HTTP 200 e conteúdo Reels acessível. |
| Trending/New | Passou; a sequência observada é diferente entre as tabs. |
| Tabs duplicadas por cartão | Resolvido; existe uma única barra de tabs. |
| Vídeos montados | Melhorado; apenas o vídeo activo e os vizinhos são montados como `<video>`, os restantes usam imagem/poster. |
| Comentários | Passou; painel abre, apresenta estado vazio, input, envio, contador e fecha sem perder o Reel. |
| Creator link/avatar | Passou visualmente no cartão publicado. |
| Partilha Telegram | Implementado com `Telegram.WebApp.openTelegramLink('https://t.me/share/url?...')`, com fallback para Web Share/clipboard fora do Telegram. |
| Likes | Mutation optimista e contagem local implementadas para posts persistidos. |
| Visualizações | `recordPostView()` é chamado uma vez por Reel persistido quando entra no viewport. |
| Erros de media | Fallback visual implementado para falhas de carregamento. |
| Stylelint | Não pôde ser executado porque o projecto não fornece configuração compatível para `src/index.css`; é um problema de configuração global pré-existente. |
| ESLint | Não pôde ser executado porque o projecto usa ESLint 10 sem `eslint.config.js`; é um problema de configuração global pré-existente. |

### Limitações remanescentes

A ordenação Trending usa as métricas que o cliente consegue ler das tabelas públicas. Se as políticas RLS do Supabase esconderem alguma dessas tabelas, a query falhará e a interface apresentará o estado de erro em vez de inventar contagens. O autoplay com áudio continua sujeito às políticas do navegador móvel; quando o cliente bloqueia áudio automático, a implementação inicia o vídeo silenciosamente e um toque do utilizador tenta reactivar o som. A confirmação definitiva do fluxo de partilha deve ser feita dentro de uma conversa Telegram real, porque `openTelegramLink` depende do cliente Telegram e não pode ser simulado integralmente no navegador.

## Commits e publicação

A correcção de código está no commit `9ce8dd1`, publicado no branch `main`. O deployment activo desta versão é `https://12a829e4.telefans.pages.dev` e a URL principal `https://telefans.pages.dev` respondeu HTTP 200 durante a auditoria.
