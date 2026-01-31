import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../constants/theme';
import * as Animatable from 'react-native-animatable';

type CellValue = 'X' | 'O' | null;
type Board = CellValue[];
type GameMode = 'pvp' | 'ai';
type Difficulty = 'easy' | 'medium' | 'hard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 420); // Max 420px like the HTML
const GAP = 14;
const MINI_BOARD_SIZE = (BOARD_SIZE - GAP * 2) / 3;
const CELL_GAP = 6;
const CELL_SIZE = (MINI_BOARD_SIZE - 20 - CELL_GAP * 2) / 3; // Account for padding

// Winning combinations
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6], // diagonals
];

export default function Game9x9Ultimate() {
  const router = useRouter();

  // Game state - 9 mini boards, each with 9 cells
  const [boards, setBoards] = useState<Board[]>(
    Array.from({ length: 9 }, () => Array(9).fill(null))
  );
  
  // Winner of each mini board
  const [boardWinners, setBoardWinners] = useState<CellValue[]>(Array(9).fill(null));
  
  // Current player
  const [currentPlayer, setCurrentPlayer] = useState<CellValue>('X');
  
  // Active board (-1 = any board, 0-8 = specific board)
  const [activeBoard, setActiveBoard] = useState<number>(-1);
  
  // Game state
  const [gameOver, setGameOver] = useState(false);
  const [gameWinner, setGameWinner] = useState<CellValue>(null);
  
  // UI state
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Check winner in a board (3 in a row)
  const checkWinner = (cells: CellValue[]): CellValue => {
    for (const [a, b, c] of WINNING_LINES) {
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return cells[a];
      }
    }
    return null;
  };

  // Check if board is full (for draw)
  const isBoardFull = (board: Board): boolean => {
    return board.every(cell => cell !== null);
  };

  // AI move logic
  const makeAIMove = () => {
    const availableMoves: { boardIdx: number; cellIdx: number }[] = [];

    for (let b = 0; b < 9; b++) {
      // Skip won boards
      if (boardWinners[b] !== null) continue;
      // Skip if not active board (when activeBoard is set)
      if (activeBoard !== -1 && activeBoard !== b) continue;

      for (let c = 0; c < 9; c++) {
        if (boards[b][c] === null) {
          availableMoves.push({ boardIdx: b, cellIdx: c });
        }
      }
    }

    if (availableMoves.length === 0) return;

    let chosenMove;

    if (difficulty === 'easy') {
      // Random move
      chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      // Try to win or block (medium/hard)
      // 1. Try to win a mini board
      for (const move of availableMoves) {
        const testBoard = [...boards[move.boardIdx]];
        testBoard[move.cellIdx] = 'O';
        if (checkWinner(testBoard) === 'O') {
          chosenMove = move;
          break;
        }
      }

      // 2. Try to block opponent's win
      if (!chosenMove) {
        for (const move of availableMoves) {
          const testBoard = [...boards[move.boardIdx]];
          testBoard[move.cellIdx] = 'X';
          if (checkWinner(testBoard) === 'X') {
            chosenMove = move;
            break;
          }
        }
      }

      // 3. For hard mode, also try to win the overall game
      if (!chosenMove && difficulty === 'hard') {
        // Try to win a board that would help win the game
        for (const move of availableMoves) {
          const testBoard = [...boards[move.boardIdx]];
          testBoard[move.cellIdx] = 'O';
          if (checkWinner(testBoard) === 'O') {
            const newBoardWinners = [...boardWinners];
            newBoardWinners[move.boardIdx] = 'O';
            if (checkWinner(newBoardWinners) === 'O') {
              chosenMove = move;
              break;
            }
          }
        }
      }

      // 4. Random if no critical move
      if (!chosenMove) {
        chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    }

    if (chosenMove) {
      handleCellPress(chosenMove.boardIdx, chosenMove.cellIdx);
    }
  };

  // AI turn effect
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !gameOver && !showModeSelector) {
      setIsAIThinking(true);
      setTimeout(() => {
        makeAIMove();
        setIsAIThinking(false);
      }, 600);
    }
  }, [currentPlayer, gameMode, gameOver, showModeSelector]);

  // Handle cell press - following Ultimate Tic-Tac-Toe rules
  const handleCellPress = (boardIdx: number, cellIdx: number) => {
    // Validation
    if (gameOver || isAIThinking) return;
    // Check if this board can be played
    if (activeBoard !== -1 && activeBoard !== boardIdx) return;
    // Check if cell or board already filled/won
    if (boards[boardIdx][cellIdx] !== null) return;
    if (boardWinners[boardIdx] !== null) return;

    // Make the move
    const newBoards = boards.map((board, idx) =>
      idx === boardIdx 
        ? board.map((cell, i) => (i === cellIdx ? currentPlayer : cell)) 
        : [...board]
    );
    setBoards(newBoards);

    // Check if this mini board is won
    const miniWinner = checkWinner(newBoards[boardIdx]);
    let newBoardWinners = [...boardWinners];
    
    if (miniWinner) {
      newBoardWinners[boardIdx] = miniWinner;
      setBoardWinners(newBoardWinners);

      // Check overall game winner
      const overallWinner = checkWinner(newBoardWinners);
      if (overallWinner) {
        setGameWinner(overallWinner);
        setGameOver(true);
        return;
      }
    }

    // Determine next active board based on the cell that was played
    // The next board to play is determined by the cell index
    // If that board is already won, any board can be played
    if (newBoardWinners[cellIdx] !== null || isBoardFull(newBoards[cellIdx])) {
      setActiveBoard(-1); // Any board
    } else {
      setActiveBoard(cellIdx);
    }

    // Switch player
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  // Reset game
  const resetGame = () => {
    setBoards(Array.from({ length: 9 }, () => Array(9).fill(null)));
    setBoardWinners(Array(9).fill(null));
    setCurrentPlayer('X');
    setActiveBoard(-1);
    setGameOver(false);
    setGameWinner(null);
  };

  // Start game with mode
  const startGame = (mode: GameMode, diff?: Difficulty) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    setShowModeSelector(false);
    resetGame();
  };

  // Go back to home
  const goHome = () => {
    router.push('/');
  };

  // Get status text
  const getStatusText = () => {
    if (gameWinner) return `🎉 Player ${gameWinner} wins the game!`;
    if (isAIThinking) return 'AI thinking...';
    if (activeBoard === -1) return `Player ${currentPlayer}'s turn`;
    return `Player ${currentPlayer}'s turn - Board ${activeBoard + 1}`;
  };

  // Check if a mini board is active (can be played)
  const isMiniBoardActive = (boardIdx: number): boolean => {
    if (gameOver) return false;
    if (boardWinners[boardIdx] !== null) return false;
    return activeBoard === -1 || activeBoard === boardIdx;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2f3b4c" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>9x9 Ultimate</Text>
        <View style={styles.backButton} />
      </View>

      {/* Mode Selector Modal */}
      <Modal 
        visible={showModeSelector} 
        animationType="fade" 
        transparent 
        onRequestClose={goHome}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={goHome}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animatable.View animation="zoomIn" style={styles.modeModal}>
              <Text style={styles.modeTitle}>Select Mode</Text>

              <TouchableOpacity
                style={styles.modeOption}
                onPress={() => startGame('pvp')}
              >
                <Ionicons name="people" size={32} color={COLORS.secondary} />
                <Text style={styles.modeOptionText}>Player vs Player</Text>
              </TouchableOpacity>

              <Text style={styles.aiLabel}>Player vs AI</Text>
              <View style={styles.aiOptions}>
                <TouchableOpacity
                  style={styles.aiButton}
                  onPress={() => startGame('ai', 'easy')}
                >
                  <Text style={styles.aiButtonText}>Easy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiButton}
                  onPress={() => startGame('ai', 'medium')}
                >
                  <Text style={styles.aiButtonText}>Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.aiButton}
                  onPress={() => startGame('ai', 'hard')}
                >
                  <Text style={styles.aiButtonText}>Hard</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Game Screen */}
      {!showModeSelector && (
        <ScrollView contentContainerStyle={styles.gameContent}>
          {/* Status */}
          <Text style={styles.status}>{getStatusText()}</Text>

          {/* Main 3x3 Board of mini boards */}
          <View style={[styles.mainBoard, { width: BOARD_SIZE }]}>
            {boards.map((miniBoard, boardIdx) => {
              const isActive = isMiniBoardActive(boardIdx);
              const winner = boardWinners[boardIdx];

              return (
                <View
                  key={boardIdx}
                  style={[
                    styles.miniBoard,
                    { width: MINI_BOARD_SIZE, height: MINI_BOARD_SIZE },
                    isActive && styles.miniBoardActive,
                    winner && styles.miniBoardWon,
                  ]}
                >
                  {winner ? (
                    <View style={styles.winnerOverlay}>
                      <Text style={[
                        styles.winnerText, 
                        { color: winner === 'X' ? '#ef4444' : '#2563eb' }
                      ]}>
                        {winner}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.miniBoardGrid}>
                      {miniBoard.map((cell, cellIdx) => (
                        <TouchableOpacity
                          key={cellIdx}
                          style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                          onPress={() => handleCellPress(boardIdx, cellIdx)}
                          disabled={!isActive || isAIThinking}
                        >
                          {cell && (
                            <Animatable.Text 
                              animation="zoomIn" 
                              style={[
                                styles.cellText,
                                { color: cell === 'X' ? '#ef4444' : '#2563eb' }
                              ]}
                            >
                              {cell}
                            </Animatable.Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.button} onPress={resetGame}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setShowModeSelector(true)}
            >
              <Ionicons name="settings" size={20} color={COLORS.secondary} />
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Mode</Text>
            </TouchableOpacity>
          </View>

          {/* Game Info */}
          <View style={styles.gameInfo}>
            <Text style={styles.gameInfoText}>
              {gameMode === 'pvp' ? 'Player vs Player' : `vs AI (${difficulty})`}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2f3b4c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameContent: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  mainBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    backgroundColor: '#2f3b4c',
    padding: 0,
  },
  miniBoard: {
    backgroundColor: '#e5e7eb',
    borderRadius: 14,
    padding: 10,
    position: 'relative',
  },
  miniBoardActive: {
    borderWidth: 3,
    borderColor: '#60a5fa',
    padding: 7,
  },
  miniBoardWon: {
    // Keep same styling for won boards
  },
  miniBoardGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  winnerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 231, 235, 0.95)',
    borderRadius: 8,
  },
  winnerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: COLORS.secondary,
  },
  gameInfo: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  gameInfoText: {
    color: '#fff',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modeModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  modeOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  aiOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  aiButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  aiButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
