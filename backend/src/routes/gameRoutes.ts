import { Router } from "express";
import { GameController } from "../controllers/GameController";

const router = Router();

router.post(
    "/create",
    GameController.createGame
);

router.get(
    "/:gameId",
    GameController.getGame
);

router.get(
    "/:gameId/legal-moves/:playerId",
    GameController.getLegalMoves
);

router.get(
    "/:gameId/turn",
    GameController.getTurn
);

router.get(
    "/:gameId/state",
    GameController.getGameState
);

router.get(
    "/:gameId/player/:playerId/hand",
    GameController.getPlayerHand
);

router.get(
    "/:gameId/view",
    GameController.getView
);

router.post(
    "/play-turn",
    GameController.playTurn
);

router.post(
    "/play-card",
    GameController.playCard
);

export default router;