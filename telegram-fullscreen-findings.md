# Telegram Mini Apps — Fullscreen findings

## Official sources

1. https://core.telegram.org/bots/webapps — Telegram Mini Apps documentation.
2. https://telegram.org/blog/fullscreen-miniapps-and-more — official Telegram announcement for Mini Apps 2.0.

## Findings

The official Mini Apps documentation states that Bot API 8.0 (17 November 2024) added full-screen mode and the WebApp methods `requestFullscreen` and `exitFullscreen`. It also added `isFullscreen`, `fullscreenChanged`, and `fullscreenFailed`, together with `safeAreaInset` and `contentSafeAreaInset`.

The frontend must only call `requestFullscreen` when `window.Telegram?.WebApp` exists. Compatibility should use the documented `isVersionAtLeast('8.0')` check before calling the method. For older clients, retain the existing documented `expand()` behavior as fallback; do not use CSS hacks, redirects, iframes, or invented APIs.

The official documentation also lists `ready()`, `expand()`, `isVersionAtLeast()`, `disableVerticalSwipes()`, `setHeaderColor()`, and `setBackgroundColor()` as WebApp APIs. The requested change should be limited to the frontend bootstrap and Telegram WebApp type definitions.

## Constraint relevant to implementation

Fullscreen is a client capability. The frontend can request it, but Telegram may reject or defer the request depending on client version, launch context, or platform. The code should listen for the documented failure event only if needed, while preserving the current Mini App behavior.
