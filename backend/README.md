# Card Game Backend

This project is a powerful, TypeScript-based backend for a trick-taking card game (such as Court Piece/Rung, Spades, or similar). It features an encapsulated, domain-driven Game Engine that manages matches, rounds, tricks, trump-suit declarations, bots, and legal move validation. It's built with Express for RESTful APIs and prepares a foundation for WebSockets to support real-time gameplay.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Game Engine Sub-module](#game-engine-sub-module)
- [Prerequisites & Installation](#prerequisites--installation)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Tech Stack](#tech-stack)

## Overview

The backend serves as the authoritative source of truth for the card game. It processes player moves, assigns turns (for players and simulated bots), enforces game rules (like following suit and trump declaration), and evaluates trick and match winners.

## Key Features

- **Encapsulated Game Engine**: Rules, domain entities (Cards, Decks, Players, Teams), bots, and state machines exist entirely in `game-engine/` module.
- **Multiple Game Modes**: Supports both `SOLO` mode (Free-for-all) and `TEAMS_2V2` multiplayer modes.
- **Bot Integration**: Includes an automated bot service (`BotScheduler`, `BotTurnService`) to seamlessly take turns for CPU players.
- **RESTful API API**: Offers an Express.js router layer to create games, retrieve game states, fetch playable turn inputs, and submit moves.
- **Real-time WebSocket gameplay**: The Socket.IO layer (`src/websocket/`) lets clients create, join, watch, and play entire games over WebSocket — bots play live one-by-one with the same events REST clients receive.
- **Rules Engines**: Implements sophisticated logic like `LegalMoveGenerator`, `TrumpResolver`, `TrickRules`, and `WinnerResolver`.

## Project Structure

```
├── game-engine/          # Core Domain Logic - Framework agnostic engine
│   ├── src/
│   │   ├── bots/         # Automated player (CPU) behaviors
│   │   ├── core/         # Core enums and interfaces (Card, Deck, Suit, Rank)
│   │   ├── domain/       # Game Entities (Match, Round, Trick, Player, Team)
│   │   ├── engines/      # Logic engines handling gameplay loops (MatchEngine, TrickEngine)
│   │   ├── rules/        # Validation layers (Legal moves, Trump declarations, Winning rules)
│   │   ├── services/     # Cross-cutting orchestration services for internal mechanics
│   │   └── session/      # Session and Game State management
├── src/                  # Express/Node App - The network & API layer
│   ├── controllers/      # Route controllers (GameController)
│   ├── middleware/       # Express middlewares (Logger, ErrorHander)
│   ├── routes/           # REST endpoints
│   ├── services/         # App-level services interfacing with the GameEngine
│   ├── types/            # DTOs and Data responses interface mappings
│   └── websocket/        # Gateway for handling WebSockets & EventEmitter bridges
├── package.json          
├── tsconfig.json          
└── .env
```

## Game Engine Sub-module

The `game-engine` is meticulously designed using Domain-Driven Design (DDD) principles. It is agnostic to the HTTP or WS layer, operating strictly in memory (or structured persistence).

- **Tricks & Rounds**: Players play a `Card` into a `Trick`. Once 4 cards are played, the trick resolves, increments points, and schedules the next turn.
- **Trump Resolver**: Contains robust logic to declare the trump suit mid-game based on the lead-suit absence factor.
- **Legal Move Valdiation**: A strict `LegalMoveGenerator` ensures that a player only plays cards they physically hold and rigidly adhere to rules (e.g., following the lead suit if they possess it).

## Prerequisites & Installation

To run the backend, ensure you have **Node.js (>= 18)** installed on your machine.

1. Clone the repository and navigate into the `backend` directory.
2. Install the necessary dependencies via npm:
   ```bash
   npm install
   ```
3. Set up the environment file by creating a `.env` in the root:
   ```env
   PORT=5000
   ```

## Deploying the REST API to Netlify

The backend includes a Netlify Function adapter for the REST API. Deploy the
`backend/` directory as the Netlify site base directory. Netlify will use
`netlify.toml`, build the function from `netlify/functions/api.ts`, and rewrite
`/api/*` requests to it. The health check is available at `/health` after
deployment.

Configure these environment variables in the Netlify site settings:

```env
CORS_ORIGINS=https://your-frontend.example
```

The game store is in memory, so function instances do not share game state and
state should not be expected to survive instance recycling. Netlify Functions
also do not support the persistent Socket.IO/WebSocket connection used by the
multiplayer frontend. Host the Socket.IO server (`npm run start`) on a
long-running Node host and set the frontend's `VITE_WS_URL` to that host. Use
the Netlify function URL (or its `/api` rewrite) for `VITE_API_URL` when using
the REST API.

For a Netlify deployment, use:

```text
Base directory: backend
Build command: npm run build
Publish directory: public
Functions directory: netlify/functions
```

## Available Scripts

Using `package.json` configurations, run the operations via `npm run <command>`.

- `npm run dev` : Spawns an auto-reloading development server powered by `tsx`.
- `npm run build` : Compiles the TypeScript source code into standard ECMAScript Modules (`dist/`).
- `npm run start` : Boots the compiled node application from the `dist` directory.
- `npm run typecheck` : Type-checks the whole project (including tests) via `tsc -p tsconfig.test.json`.
- `npm run test` : Runs the full Vitest suite (unit + API + WebSocket tests).
- `npm run ws:test` : Runs the standalone scripted WS-only match client (`scripts/wsTestClient.ts`). Requires the server to be running (`npm run dev` or `npm start`).

## API Endpoints

The API is mounted onto `/api/games`.

| HTTP Method | Endpoint                                | Description                                |
|-------------|-----------------------------------------|--------------------------------------------|
| `GET`       | `/api/games/health`                     | Check the server health and ping           |
| `POST`      | `/api/games/create`                     | Intiate a new game session                 |
| `GET`       | `/api/games/:gameId`                    | Fetch raw game session object              |
| `DELETE`    | `/api/games/:gameId`                    | Cleanly remove a game session              |
| `GET`       | `/api/games/:gameId/turn`               | Identify whose turn it is currently        |
| `GET`       | `/api/games/:gameId/legal-moves/:player`| Fetch playable cards for a given player id |
| `GET`       | `/api/games/:gameId/state`              | Full Game State Data Transfer Object       |
| `GET`       | `/api/games/:gameId/player/:playerId/hand`| Display the given player's hand        |
| `POST`      | `/api/games/play-card`                  | Submit a single card payload            |
| `POST`      | `/api/games/play-turn`                  | Submit the human play; bots resolve synchronously, returns `{ events, snapshot }` |

## WebSocket Protocol

The Socket.IO server shares the same port as the REST API. All commands are emitted by the client, all events are pushed by the server, and every command accepts an optional ack callback.

### Envelope shape

Events are pushed as envelopes:

```ts
{
  type: "CARD_PLAYED",   // server event name
  payload: { ... },       // event-specific data
  snapshot?: { ... },     // full game view (present on TRICK/ROUND/MATCH_COMPLETED and GAME_STATE)
  timestamp: number
}
```

Exception: the presence events `GAME_JOINED` and `GAME_LEFT` are emitted as **raw payloads** (`{ gameId, playerId, socketId }`) rather than envelopes. All other server events use the envelope above.

### Client commands (emit + optional ack)

| Command | Payload | Ack |
|---------|---------|-----|
| `GAME:PING` | `{}` | `{ ok: true, data: null }` |
| `GAME:CREATE` | `{ numberOfRounds, difficulty, mode }` | `{ ok, data: { gameId, snapshot } }` |
| `GAME:JOIN` | `{ gameId, playerId }` | `{ ok, data: { gameId } }` + pushes `GAME_JOINED` and `GAME_STATE` |
| `GAME:LEAVE` | `{ gameId }` | `{ ok }` |
| `GAME:REMOVE` | `{ gameId }` | `{ ok }` |
| `GAME:PLAY_CARD` | `{ gameId, playerId, cardId }` | `{ ok, data: { events, snapshot } }` (human move; bots continue asynchronously) |
| `GAME:GET_STATE` | `{ gameId }` | `{ ok, data: <game state> }` |
| `GAME:GET_TURN` | `{ gameId }` | `{ ok, data: <turn> }` |
| `GAME:GET_LEGAL_MOVES` | `{ gameId, playerId }` | `{ ok, data: <cards> }` |
| `GAME:GET_HAND` | `{ gameId, playerId }` | `{ ok, data: <hand> }` |

Errors return `{ ok: false, error: { code, message, gameId? } }` and push a `GAME_ERROR` event. Typed codes include `BAD_PAYLOAD`, `GAME_NOT_FOUND`, `PLAYER_NOT_FOUND`, `CARD_NOT_FOUND`, `ILLEGAL_MOVE`, `NOT_YOUR_TURN`, `GAME_BUSY`, `UNKNOWN_EVENT`.

### Server events

`GAME_CREATED`, `GAME_JOINED`, `GAME_LEFT`, `ROUND_STARTED`, `CARD_PLAYED`, `BOT_PLAY`, `TURN_CHANGED`, `TRUMP_DECLARED`, `TRICK_COMPLETED`, `ROUND_COMPLETED`, `MATCH_COMPLETED`, `GAME_STATE`, `GAME_REMOVED`, `GAME_ERROR`.

### WS-only client

A client can play an entire game without touching REST:

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

socket.emit("GAME:CREATE", { numberOfRounds: 2, difficulty: "easy", mode: "SOLO" }, (ack: any) => {
  const { gameId } = ack.data;
  socket.emit("GAME:JOIN", { gameId, playerId: "P1" });
  // then loop: GAME:GET_STATE -> GAME:GET_LEGAL_MOVES -> GAME:PLAY_CARD,
  // waiting for currentPlayerId === "P1" (or completed) between plays.
});

socket.on("MATCH_COMPLETED", (envelope) => console.log(envelope.payload.winnerPlayerId));
```

See `scripts/wsTestClient.ts` for a complete runnable example (`npm run ws:test`).

## REST + WebSocket coexistence

- Both transports run on the **same port** and operate on the same in-memory session store.
- A game created via REST can be joined and watched over WebSocket, and vice versa.
- Same-game play is serialized by an in-flight guard: a REST `play-turn` while a WS bot chain is running returns `409 Game is busy`; the WS `GAME:PLAY_CARD` ack is held until the chain finishes.
- Joining mid-game pushes `GAME_STATE` with the current full snapshot.

## Testing

- `npm run test` — full suite: unit tests, engine rules, REST regression, WS handlers, and end-to-end matches over both transports.
- `npm run ws:test` — standalone scripted WS-only match (start the server first).
- `npm run typecheck` and `npm run build` — static checks and production compile.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js (HTTP / REST APIs)
- **Sockets**: Socket.IO (Real-time architecture)
- **Utilities**: CORS, Morgan (Request Logging), Dotenv
