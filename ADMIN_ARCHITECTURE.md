# TeleFans — Arquitetura do painel administrativo

## Diagnóstico

O painel atual é apenas uma camada visual sobre `localStorage`. A gestão de modelos, posts e Reels não está ligada ao Supabase; não há edição completa de perfis, biblioteca de mídia, upload, rascunhos editoriais, agendamento, moderação, auditoria ou métricas persistentes.

As páginas públicas já usam o Supabase para leitura de creators/posts publicados e para likes, comentários e views. O hero e a geometria de `/creator/*` não devem ser reescritos durante a reconstrução do admin.

## Separação de responsabilidades

| Área | Fonte de verdade | Regra |
| --- | --- | --- |
| `/creator/*`, `/reels`, Explore | Supabase + fallback público | Só conteúdo publicado é visível |
| `/app/*` | Supabase Auth + `admin_roles` | Apenas admins autenticados |
| Uploads e biblioteca de mídia | Supabase Storage + `media_assets` | Mídia passa por estado de processamento/publicação |
| Likes, comentários e views | Supabase | Interações públicas não concedem permissões admin |
| Telegram Mini App | `telegram_users` + Edge Function | Fluxo separado do Supabase Auth admin |

## Fluxo editorial

1. Admin cria ou edita o perfil do creator.
2. Admin envia imagens/vídeos para a biblioteca de mídia.
3. Admin cria um item de conteúdo associado a um creator e escolhe `feed`, `reels` ou ambos.
4. Item fica como `draft` até validação.
5. Ao publicar, o conteúdo passa a aparecer no feed do creator e, quando habilitado, na fila pública de Reels.
6. Despublicar remove a visibilidade pública sem apagar o histórico.
7. Todas as ações editoriais importantes geram um registo de auditoria.

## Critérios de segurança

As escritas administrativas devem exigir `is_admin()`. Leitura pública deve limitar-se a creators/posts com estado publicado. O frontend não deve conter chaves privilegiadas. A biblioteca de mídia deve guardar apenas URLs públicas ou assinadas e metadados, nunca tokens.

## Critérios de UI

O admin terá um shell responsivo com navegação lateral em ecrãs largos e navegação compacta em ecrãs estreitos. Cada página terá estados de carregamento, vazio, erro e sucesso. Formulários terão validação, preview, confirmação para ações destrutivas e feedback após mutações.

## Fases de implementação

- Expandir o schema persistente para mídia, estado editorial, Following e auditoria.
- Criar repositórios tipados para admin.
- Recriar o dashboard e o CRUD de creators.
- Implementar biblioteca/upload e editor de posts/Reels.
- Ligar publicação aos feeds e interações persistentes.
- Testar permissões, regressões públicas e experiência mobile.
