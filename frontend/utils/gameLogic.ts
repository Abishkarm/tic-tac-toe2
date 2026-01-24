import { Player, Board3x3, Board9x9 } from '../types/game';

// 3x3 Game Logic
export const gameLogic3x3 = {
  createEmptyBoard(): Board3x3 {
    return Array(9).fill(null);
  },

  getWinningLine(board: Board3x3): number[] | null {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6], // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return pattern;
      }
    }
    return null;
  },

  checkWinner(board: Board3x3): Player {
    const winningLine = this.getWinningLine(board);
    return winningLine ? board[winningLine[0]] : null;
  },

  checkDraw(board: Board3x3): boolean {
    return board.every(cell => cell !== null) && !this.checkWinner(board);
  },

  getAvailableMoves(board: Board3x3): number[] {
    return board.map((cell, index) => (cell === null ? index : -1)).filter(i => i !== -1);
  },

  makeMove(board: Board3x3, index: number, player: Player): Board3x3 {
    const newBoard = [...board];
    newBoard[index] = player;
    return newBoard;
  },
};

// 9x9 Ultimate Tic-Tac-Toe Logic
export const gameLogic9x9 = {
  createEmptyBoard(): Board9x9 {
    return Array(9).fill(null).map(() => Array(9).fill(null));
  },

  createEmptySmallBoards(): Player[] {
    return Array(9).fill(null);
  },

  // Check winner of a small 3x3 board
  checkSmallBoardWinner(smallBoard: Player[]): Player {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6], // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (smallBoard[a] && smallBoard[a] === smallBoard[b] && smallBoard[a] === smallBoard[c]) {
        return smallBoard[a];
      }
    }
    return null;
  },

  // Check overall game winner (same as 3x3 but on small boards)
  checkGameWinner(smallBoards: Player[]): Player {
    return gameLogic3x3.checkWinner(smallBoards);
  },

  // Check if small board is full
  isSmallBoardFull(smallBoard: Player[]): boolean {
    return smallBoard.every(cell => cell !== null);
  },

  // Get next active board based on move
  getNextActiveBoard(cellIndex: number, smallBoards: Player[], board: Board9x9): number | null {
    const nextBoard = cellIndex % 9;
    const nextSmallBoard = board[nextBoard];
    
    // If next board is already won or full, player can choose any board
    if (smallBoards[nextBoard] !== null || this.isSmallBoardFull(nextSmallBoard)) {
      return null; // Any board is available
    }
    return nextBoard;
  },

  // Get a specific small board from the main board
  getSmallBoard(boardIndex: number, mainBoard: Board9x9): Player[] {
    return mainBoard[boardIndex];
  },

  // Make a move in the 9x9 board
  makeMove(board: Board9x9, boardIndex: number, cellIndex: number, player: Player): Board9x9 {
    const newBoard = board.map(smallBoard => [...smallBoard]);
    newBoard[boardIndex][cellIndex] = player;
    return newBoard;
  },

  // Check if a move is valid
  isValidMove(
    board: Board9x9,
    smallBoards: Player[],
    activeBoard: number | null,
    boardIndex: number,
    cellIndex: number
  ): boolean {
    // Check if the small board is already won
    if (smallBoards[boardIndex] !== null) return false;
    
    // Check if cell is already occupied
    if (board[boardIndex][cellIndex] !== null) return false;
    
    // If there's an active board restriction, check it
    if (activeBoard !== null && activeBoard !== boardIndex) return false;
    
    return true;
  },
};
