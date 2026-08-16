# Auditoria conjunta Reels — referências e interacções

## Referências visuais recebidas

A primeira referência define o estado normal: vídeo vertical em ecrã inteiro; cabeçalho nativo do Telegram no topo; botão Voltar à esquerda; tabs Trending/New centradas com sublinhado; menu nativo à direita; creator e avatar junto à base esquerda; acções verticais à direita com avatar/seguir, like, comentários e partilha; navegação inferior translúcida com Reels activo.

A segunda referência define o painel de comentários: bottom sheet escuro sobre a parte inferior do vídeo, título com contagem total (por exemplo, “49 comments”), botão circular de fechar, lista com avatar/letra, nome do utilizador, tempo relativo, texto, Reply e like individual; campo fixo “Add comment…” e botão “Post” no rodapé.

## Evidência Supabase

Projecto: `gtvzvvtnhmjtcgvjnfrr` (`telefans`). A tabela `post_likes` tem `user_id` UUID não-null com foreign key para `auth.users`, além de `visitor_key`. As políticas RLS permitem inserir visitante apenas quando `user_id IS NULL AND visitor_key IS NOT NULL`. Contudo, o frontend actual insere `{ user_id: visitorKey, visitor_key: visitorKey }`, usando um UUID local como `user_id`; isso viola o contrato da tabela e explica os likes sem persistência. A tabela `post_likes` está vazia.

As políticas de `post_comments` permitem leitura pública e inserção quando `user_id = auth.uid()` ou `user_id IS NULL AND visitor_key IS NOT NULL`. Existe pelo menos um comentário persistido no post `c290c342-c9db-4a8b-b988-9c8c659344e0`, com `user_id` nulo e `visitor_key` local, provando que a gravação de comentários funciona em alguns contextos. A UI actual, porém, mostra apenas o corpo do comentário, não nome/avatar/tempo/reply/like, e faz optimistic append sem recarregar a linha persistida.

Todos os 20 posts de vídeo publicados inspeccionados têm `comments_enabled = true`, portanto o bloqueio visual não é causado pela configuração dos posts.
