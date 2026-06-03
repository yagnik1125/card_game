import { Request, Response } from "express";
import { GameService } from "../services/GameService";

interface GameParams {
    gameId: string;
}

interface PlayCardBody {
    gameId: string;
    playerId: string;
    cardId: string;
}

interface LegalMoveParams {
    gameId: string;
    playerId: string;
}

interface PlayerParams {
    gameId: string;
    playerId: string;
}

export class GameController {
    static createGame(
        req: Request,
        res: Response
    ) {
        try {
            const session = GameService.createGame();
            return res.status(201).json({
                success: true,
                data: session
            });
        } catch (error) {
            return res.status(500).json({
                success: false
            });
        }
    }

    static getGame(
        req: Request<GameParams>,
        res: Response
    ) {
        try {
            const session = GameService.getGame(req.params.gameId);
            return res.json({
                success: true,
                data: session
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: "Game not found"
            });
        }
    }

    static playCard(
        req: Request<{}, {}, PlayCardBody>,
        res: Response
    ) {
        try {
            const { gameId, playerId, cardId } = req.body;
            const session = GameService.playCard(gameId, playerId, cardId);
            return res.json({
                success: true,
                data: session
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static getLegalMoves(
        req: Request<LegalMoveParams>,
        res: Response
    ) {
        try {
            const cards = GameService.getLegalMoves(req.params.gameId, req.params.playerId);
            return res.json({
                success: true,
                data: cards,
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    static getTurn(
        req: Request<GameParams>,
        res: Response
    ) {
        try {
            return res.json({
                success: true,
                data: GameService.getTurn(req.params.gameId)
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static getGameState(
        req: Request<GameParams>,
        res: Response
    ) {
        try {
            const state = GameService.getGameState(req.params.gameId);
            return res.json({
                success: true,
                data: state
            });
        } catch (error: any) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    static getPlayerHand(
        req: Request<PlayerParams>,
        res: Response
    ) {
        try {
            const hand =GameService.getPlayerHand(req.params.gameId,req.params.playerId);
            return res.json({
                success: true,
                data: hand
            });
        } catch (error: any) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }
}