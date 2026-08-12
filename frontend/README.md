# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## WebSocket (WS) frontend

The app also ships a WebSocket-only client stack (`src/ws/`) with its own pages,
routed separately from the REST pages:

| Route | Page |
| --- | --- |
| `/ws` | `WsHomePage` — create a SOLO or TEAMS_2V2 game over the socket (`GAME:CREATE`) |
| `/ws/game/:gameId` | `WsGamePage` — live SOLO game over the socket (`useWsGame` + `useWsAnimator`) |
| `/ws/game/team2v2/:gameId` | `WsTeam2V2GamePage` — live 2v2 team game over the socket |

### How to run the WS frontend

1. Start the backend (it serves REST + Socket.IO on the same port, default `5000`):
   ```
   cd backend && npm run dev
   ```
2. Start the frontend dev server:
   ```
   cd frontend && npm run dev
   ```
3. Open `http://localhost:5173/ws`, pick difficulty/rounds, and press **Play**.

### WS smoke test

A backend must be running, then:

```
npm run ws:smoke:game
```

`scripts/wsFrontendSmoke.ts` drives the real frontend client stack
(`socketClient`) through full matches: connect → `GAME:CREATE` → `GAME:JOIN` →
play legal cards until the match completes → assert `MATCH_COMPLETED` with a
`winnerPlayerId` (SOLO) or `winnerTeamId` (TEAMS_2V2). Once per variant it also
simulates a mid-game reload (disconnect → reconnect → re-join) and asserts the
board catches up via resync. By default both variants run; pass a mode to run
one, e.g. `npm run ws:smoke:game -- TEAMS_2V2`. Prints `[ws-smoke] PASS` on
success and exits non-zero on failure.

### WS resilience & polish

- **Reconnect UX**: `useSocket` exposes `reconnecting`; the game pages show a
  "Reconnecting to the game server…" banner, disable the hand while reconnecting,
  and flash a "Reconnected — resynced" indicator once the socket returns. On
  reconnect `useWsGame` re-emits `GAME:JOIN` and the board resyncs from
  `GAME_STATE` (single source of truth).
- **Error mapping**: `src/ws/utils/errors.ts` maps backend error codes
  (`ILLEGAL_MOVE`, `NOT_YOUR_TURN`, `GAME_BUSY`, `GAME_NOT_FOUND`, …) to the
  same friendly copy the REST pages use; `GAME_NOT_FOUND` auto-redirects home.
- **Ordering/dedup**: the reducer keeps a `lastSignature` dedup, rejects stale
  `CARD_PLAYED`/`BOT_PLAY` already reflected in the snapshot, and drops terminal
  events for tricks the snapshot has already advanced past. A `stateVersion`
  counter lets `useWsAnimator` drop queued timers on resync so rebuilt trick
  cards never re-animate.
- **Presence**: a "watching" badge shows when a second client joins the room
  (`GAME_JOINED`/`GAME_LEFT`).
- **Accessible modals**: all WS modal variants are `role="dialog"` +
  `aria-modal` and close on Escape (REST modals untouched).
- **Pacing**: animation/modal durations come from `src/ws/config.ts` and can be
  tuned with `VITE_WS_ANIM_CARD_MS`, `VITE_WS_ANIM_DEALING_MS`,
  `VITE_WS_ANIM_TRUMP_MS`, `VITE_WS_ANIM_TRICK_MS`, `VITE_WS_ANIM_ROUND_MS`.

### Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5000/api` | REST backend base URL (REST frontend only). |
| `VITE_WS_URL` | derived from `VITE_API_URL` (`/api` suffix stripped) | Socket.IO server URL for the WS frontend. |
| `VITE_WS_ANIM_CARD_MS` | `700` | Card-play pacing (ms). |
| `VITE_WS_ANIM_DEALING_MS` | `1600` | Dealing animation duration (ms). |
| `VITE_WS_ANIM_TRUMP_MS` | `2000` | Trump-declaration modal duration (ms). |
| `VITE_WS_ANIM_TRICK_MS` | `1000` | Trick-winner modal duration (ms). |
| `VITE_WS_ANIM_ROUND_MS` | `2000` | Round-winner modal duration (ms). |

`VITE_WS_URL` accepts an `http(s)://` or `ws(s)://` URL; `socket.io-client`
normalizes it. Example `.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

### WS protocol reference

The WS frontend speaks Socket.IO to the same backend that serves REST (same
port, `/socket.io` path). Every server push is a `ServerEnvelope`
`{ type, payload, snapshot?, timestamp }`; every client command is an
acknowledged emit (`WsAck<T>` = `{ ok, data }` or `{ ok: false, error }`).

| Direction | Event / command | Payload keys |
| --- | --- | --- |
| client → server | `GAME:PING` | — |
| client → server | `GAME:CREATE` | `{ numberOfRounds, difficulty, mode }` |
| client → server | `GAME:JOIN` | `{ gameId, playerId }` |
| client → server | `GAME:LEAVE` | `{ gameId }` |
| client → server | `GAME:REMOVE` | `{ gameId }` |
| client → server | `GAME:PLAY_CARD` | `{ gameId, playerId, cardId }` |
| client → server | `GAME:GET_STATE` / `GAME:GET_TURN` | `{ gameId }` |
| client → server | `GAME:GET_LEGAL_MOVES` / `GAME:GET_HAND` | `{ gameId, playerId }` |
| server → client | `GAME_CREATED` | `{ gameId }` |
| server → client | `GAME_JOINED` / `GAME_LEFT` | presence — **raw payload, not an envelope** |
| server → client | `ROUND_STARTED` | `{ gameId, roundNumber, championPlayerId, championTeamId }` |
| server → client | `CARD_PLAYED` / `BOT_PLAY` | `{ playerId, cardId, suit, rank }` |
| server → client | `TURN_CHANGED` | `{ currentPlayerId, turnNumber }` |
| server → client | `TRUMP_DECLARED` | `{ playerId, suit }` |
| server → client | `TRICK_COMPLETED` | `{ trickNumber, winnerPlayerId, trickWinner, trickWinnerTeam? }` + `snapshot` |
| server → client | `ROUND_COMPLETED` | `{ roundNumber, winnerPlayerId, roundWinner?, roundWinnerTeam?, … }` + `snapshot` |
| server → client | `MATCH_COMPLETED` | `{ winnerPlayerId?, winnerTeamId?, roundWinner?, roundWinnerTeam? }` + `snapshot` |
| server → client | `GAME_STATE` | full view `snapshot` (the `getView` shape) |
| server → client | `GAME_REMOVED` | `{ gameId }` |
| server → client | `GAME_ERROR` | `{ code, message, gameId? }` |

Differences from the REST flow:

- **No REST calls at all** in the WS flow — create/join/play/leave/remove and
  every view update arrive over the socket; the snapshot rides along on
  `TRICK_COMPLETED`/`ROUND_COMPLETED`/`MATCH_COMPLETED`/`GAME_STATE`.
- REST pages drive the UI by looping over engine-shaped `playTurn().events`;
  WS pages are **event-driven** — `src/ws/store/eventReducer.ts` turns each
  envelope into a `wsGame` state transition (with signature dedup + snapshot
  resync).
- WS payload keys follow the backend envelope names (`winnerPlayerId`,
  `trickNumber`), not the REST event keys (`playerId`, `winner`).

The mirrored types live in `src/ws/protocol/` (commands, server events,
responses, guards) and `src/ws/dto/` (view + winner shapes); the source of
truth is `backend/src/websocket/protocol/*.ts` and `GameService.getView`. A
shortened summary is in `src/ws/README.md`.
