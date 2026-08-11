# WS frontend — protocol & shared types

Typed WebSocket contracts for the real-time frontend. The types mirror the
backend's implemented protocol exactly:

| Backend source of truth | FE mirror |
|---|---|
| `backend/src/websocket/protocol/clientEvents.ts` | `src/ws/protocol/clientCommands.ts` |
| `backend/src/websocket/protocol/serverEvents.ts` | `src/ws/protocol/serverEvents.ts` |
| `backend/src/websocket/protocol/responses.ts` | `src/ws/protocol/responses.ts` |
| `backend/src/websocket/protocol/guards.ts` | `src/ws/protocol/guards.ts` |
| `backend/src/services/GameService.ts` (`getView`) | `src/ws/dto/gameView.ts` |
| `backend/game-engine/src/events/GameEvents.ts` (winners) | `src/ws/dto/winners.ts` |

## Client commands (acknowledged)

| Command | Payload |
|---|---|
| `GAME:PING` | `{}` (marker `_?: undefined`) |
| `GAME:CREATE` | `{ numberOfRounds: number, difficulty: "easy"\|"medium"\|"hard", mode: "SOLO"\|"TEAMS_2V2" }` |
| `GAME:JOIN` | `{ gameId: string, playerId: string }` |
| `GAME:LEAVE` | `{ gameId: string }` |
| `GAME:REMOVE` | `{ gameId: string }` |
| `GAME:PLAY_CARD` | `{ gameId: string, playerId: string, cardId: string }` |
| `GAME:GET_STATE` | `{ gameId: string }` |
| `GAME:GET_TURN` | `{ gameId: string }` |
| `GAME:GET_LEGAL_MOVES` | `{ gameId: string, playerId: string }` |
| `GAME:GET_HAND` | `{ gameId: string, playerId: string }` |

Every command acks with `WsAck<T>`: `{ ok: true, data }` or
`{ ok: false, error: { code, message, gameId? } }`.

## Server events (room broadcast)

Every event is pushed as a `ServerEnvelope`:
`{ type, payload, snapshot?, timestamp }`.

| Event | Payload keys |
|---|---|
| `GAME_CREATED` | `gameId` |
| `GAME_JOINED` | `gameId, playerId, socketId` |
| `GAME_LEFT` | `gameId, playerId?, socketId` |
| `ROUND_STARTED` | `gameId, roundNumber, championPlayerId, championTeamId` |
| `CARD_PLAYED` | `playerId, cardId, suit, rank` |
| `BOT_PLAY` | `playerId, cardId, suit, rank` |
| `TURN_CHANGED` | `currentPlayerId, turnNumber` |
| `TRUMP_DECLARED` | `playerId, suit` |
| `TRICK_COMPLETED` | `trickNumber, winnerPlayerId, trickWinner, trickWinnerTeam?` |
| `ROUND_COMPLETED` | `roundNumber, winnerPlayerId, trickWinner?, trickWinnerTeam?, roundWinner?, roundWinnerTeam?` |
| `MATCH_COMPLETED` | `winnerPlayerId?, winnerTeamId?, roundWinner?, roundWinnerTeam?` |
| `GAME_STATE` | `gameId` (+ `snapshot`) |
| `GAME_REMOVED` | `gameId` |
| `GAME_ERROR` | `code, message, gameId?` |

> **Trap:** envelope payload keys are NOT the REST `playTurn().events` keys —
> `winnerPlayerId` not `playerId`, `trickWinner` object, etc. Consume
> `envelope.payload` only, through `src/ws/dto/normalizers.ts`.

## Snapshot (`GAME_STATE` / ack data / envelope `snapshot`)

`GameView` — see `src/ws/dto/gameView.ts`:

```
{ gameId, completed, roundNumber, trumpSuit, champion, championTeam,
  currentPlayerId, players[], teams[], legalMoves[], currentTrick }
```

`players[]` entries: `{ id, name, cardsRemaining, tricksWonRound, totalTricks,
roundsWon, hand? (P1 only), teamId? }`. The human player is always `P1`; the
`hand` field is present only for `P1`.
