import { Request, Response } from "express";
import { GameService } from "../services/GameService";
import { Card, GameSession, GameSessionManager } from "trump-and-twist-game-engine";
import { GameStateResponse } from "../types/GameStateResponse";
import { PlayTurnResponse } from "../types/PlayTurnResponse";

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

interface PlayTurnBody {
    gameId: string;
    playerId: string;
    cardId: string;
}

export class GameController {
    static createGame(
        req: Request,
        res: Response
    ) {
        try {
            const session: GameSession = GameService.createGame(req.body.numberOfRounds, req.body.difficulty);
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
            const session: GameSession = GameService.getGame(req.params.gameId);
            return res.status(200).json({
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
            return res.status(200).json({
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
            const cards: Card[] = GameService.getLegalMoves(req.params.gameId, req.params.playerId);
            return res.status(200).json({
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
            return res.status(200).json({
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
            const state: GameStateResponse = GameService.getGameState(req.params.gameId);
            return res.status(200).json({
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
            const hand = GameService.getPlayerHand(req.params.gameId, req.params.playerId);
            return res.status(200).json({
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

    static getView(
        req: Request<GameParams>,
        res: Response
    ) {
        try {
            return res.status(200).json({
                success: true,
                data: GameService.getView(req.params.gameId)
            });
        } catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static removeGame(
        req: Request<GameParams>,
        res: Response
    ) {
        try {
            GameSessionManager.remove(req.params.gameId);
            return res.status(204).json({
                success: true,
                message: "Game removed Successfully."
            });
        }
        catch (error: any) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    static playTurn(
        req: Request<{}, {}, PlayTurnBody>,
        res: Response
    ) {
        try {
            const result: PlayTurnResponse = GameService.playTurn(
                req.body.gameId,
                req.body.playerId,
                req.body.cardId
            );
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error: any) {
            console.log(error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}