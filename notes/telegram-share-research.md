# Telegram native message sharing

Sources consulted:

- https://core.telegram.org/bots/webapps
- https://core.telegram.org/bots/api

Findings from the official Telegram Mini Apps documentation:

- Bot API 8.0 added WebApp.shareMessage to share media from a Mini App to Telegram chats.
- The WebApp API also exposes shareMessageSent and shareMessageFailed events.
- The shareMessage flow uses a prepared inline message; the Bot API provides savePreparedInlineMessage to store a message that can later be shared by the Mini App user.
- The native dialog shown by the user's second screenshot is therefore not the same flow as opening https://t.me/share/url. The latter opens Telegram's URL/chat selector, while the desired dialog requires a prepared message and WebApp.shareMessage(prepared_message_id).
- The Telegram docs also define safeAreaInset and contentSafeAreaInset for Mini App layout, relevant to the existing TeleFans chrome work.
