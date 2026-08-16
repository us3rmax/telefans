# Add to home screen implementation notes

## Official Telegram Mini Apps documentation
Source: https://core.telegram.org/bots/webapps

Telegram Bot API 8.0 introduced official home-screen shortcut support for Mini Apps:
- `WebApp.addToHomeScreen()` creates a shortcut for users to add to their home screens.
- `WebApp.checkHomeScreenStatus()` determines shortcut support/status.
- Events include `homeScreenAdded` and `homeScreenChecked`.

The current project profile helper already declares `addToHomeScreen`, but the current button only shows an in-app timeout message and never calls the official Telegram method.

## Official MDN documentation
Source: https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event

The `beforeinstallprompt` event is limited availability and only fires when a browser determines that a site is installable as a PWA. A custom install UI should retain the event and call its `prompt()` method after a user gesture. Safari/iOS does not support this event consistently, so it needs manual Share > Add to Home Screen instructions.
