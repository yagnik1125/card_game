export interface MatchState {
    currentRound: number;
    totalRounds: number;
    championPlayerId?: string;
    championTeamId?: string;
    isCompleted: boolean;
}