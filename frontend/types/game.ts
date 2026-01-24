export type Player = 'X' | 'O' | null;
export type Board3x3 = Player[];
export type Board9x9 = Player[][];

export type GameMode = '3x3' | '9x9';
export type MultiplayerMode = 'local' | 'ai' | 'online' | 'bluetooth';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState3x3 {
  board: Board3x3;
  currentPlayer: Player;
  winner: Player;
  isDraw: boolean;
  moveCount: number;
}

export interface GameState9x9 {
  board: Board9x9;
  smallBoards: Player[]; // Winners of each small board
  currentPlayer: Player;
  activeBoard: number | null; // Which small board is active
  winner: Player;
  isDraw: boolean;
  moveCount: number;
}

export interface Score {
  playerX: number;
  playerO: number;
  draws: number;
}

export interface Settings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showScore: boolean;
  lastPage: string;
}

export interface OnlineRoom {
  roomId: string;
  gameMode: GameMode;
  players: string[];
  maxPlayers: number;
  isPrivate: boolean;
}
