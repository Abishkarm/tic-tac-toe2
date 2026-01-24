import { Player, Board3x3 } from '../types/game';
import { gameLogic3x3 } from './gameLogic';

// Minimax Algorithm for unbeatable AI
class AIEngine {
  // Evaluate board state for AI
  private evaluate(board: Board3x3): number {
    const winner = gameLogic3x3.checkWinner(board);
    if (winner === 'O') return 10; // AI wins
    if (winner === 'X') return -10; // Player wins
    return 0; // Draw or ongoing
  }

  // Minimax algorithm with alpha-beta pruning
  private minimax(
    board: Board3x3,
    depth: number,
    isMaximizing: boolean,
    alpha: number,
    beta: number,
    maxDepth: number
  ): number {
    const score = this.evaluate(board);

    // Terminal conditions
    if (score === 10) return score - depth;
    if (score === -10) return score + depth;
    if (gameLogic3x3.checkDraw(board)) return 0;
    if (depth >= maxDepth) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      const moves = gameLogic3x3.getAvailableMoves(board);

      for (const move of moves) {
        const newBoard = gameLogic3x3.makeMove(board, move, 'O');
        const value = this.minimax(newBoard, depth + 1, false, alpha, beta, maxDepth);
        best = Math.max(best, value);
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return best;
    } else {
      let best = Infinity;
      const moves = gameLogic3x3.getAvailableMoves(board);

      for (const move of moves) {
        const newBoard = gameLogic3x3.makeMove(board, move, 'X');
        const value = this.minimax(newBoard, depth + 1, true, alpha, beta, maxDepth);
        best = Math.min(best, value);
        beta = Math.min(beta, best);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return best;
    }
  }

  // Easy AI - Random moves with occasional strategy
  getEasyMove(board: Board3x3): number {
    const availableMoves = gameLogic3x3.getAvailableMoves(board);
    
    // 30% chance to make a strategic move
    if (Math.random() < 0.3) {
      // Check if AI can win
      for (const move of availableMoves) {
        const testBoard = gameLogic3x3.makeMove(board, move, 'O');
        if (gameLogic3x3.checkWinner(testBoard) === 'O') {
          return move;
        }
      }
    }
    
    // Otherwise, random move
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Medium AI - Uses minimax with limited depth
  getMediumMove(board: Board3x3): number {
    const availableMoves = gameLogic3x3.getAvailableMoves(board);
    
    // Check for immediate win
    for (const move of availableMoves) {
      const testBoard = gameLogic3x3.makeMove(board, move, 'O');
      if (gameLogic3x3.checkWinner(testBoard) === 'O') {
        return move;
      }
    }

    // Check for blocking opponent's win
    for (const move of availableMoves) {
      const testBoard = gameLogic3x3.makeMove(board, move, 'X');
      if (gameLogic3x3.checkWinner(testBoard) === 'X') {
        return move;
      }
    }

    // Use minimax with depth 3
    let bestMove = availableMoves[0];
    let bestValue = -Infinity;

    for (const move of availableMoves) {
      const newBoard = gameLogic3x3.makeMove(board, move, 'O');
      const moveValue = this.minimax(newBoard, 0, false, -Infinity, Infinity, 3);

      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Hard AI - Unbeatable using full minimax
  getHardMove(board: Board3x3): number {
    const availableMoves = gameLogic3x3.getAvailableMoves(board);
    let bestMove = availableMoves[0];
    let bestValue = -Infinity;

    for (const move of availableMoves) {
      const newBoard = gameLogic3x3.makeMove(board, move, 'O');
      const moveValue = this.minimax(newBoard, 0, false, -Infinity, Infinity, 9);

      if (moveValue > bestValue) {
        bestValue = moveValue;
        bestMove = move;
      }
    }

    return bestMove;
  }

  // Get AI move based on difficulty
  getMove(board: Board3x3, difficulty: 'easy' | 'medium' | 'hard'): number {
    switch (difficulty) {
      case 'easy':
        return this.getEasyMove(board);
      case 'medium':
        return this.getMediumMove(board);
      case 'hard':
        return this.getHardMove(board);
      default:
        return this.getHardMove(board);
    }
  }
}

export const aiEngine = new AIEngine();
