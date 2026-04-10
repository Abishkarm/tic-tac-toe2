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

// === ROBUST LAYOUT CALCULATIONS ===
const BOARD_MARGIN = 2;
const BOARD_PADDING = 2;
const MINI_GAP = 2; // visible indigo separator between mini-boards
const CELL_GAP = 1;
const MINI_PADDING = 1;

// Board fills nearly the full screen width
const BOARD_OUTER_SIZE = Math.min(SCREEN_WIDTH - BOARD_MARGIN * 2, 420);
const BOARD_INNER = BOARD_OUTER_SIZE - BOARD_PADDING * 2;
const MINI_BOARD_SIZE = Math.floor((BOARD_INNER - MINI_GAP * 2) / 3);
const CELL_SIZE = Math.floor((MINI_BOARD_SIZE - MINI_PADDING * 2 - CELL_GAP * 2) / 3);
const GRID_SIZE = CELL_SIZE * 3 + CELL_GAP * 2;

// Active board highlight — bright orange/amber
const ACTIVE_BORDER_COLOR = '#f97316';
const ACTIVE_BG_COLOR = '#fff7ed';

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
  const [isDraw, setIsDraw] = useState(false);
  
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

  // Check if overall game is draw
  const isGameDraw = (winners: CellValue[], allBoards: Board[]): boolean => {
    // All boards are either won or full
    for (let i = 0; i < 9; i++) {
      if (winners[i] === null && !isBoardFull(allBoards[i])) {
        return false;
      }
    }
    return checkWinner(winners) === null;
  };

  // AI move logic
  const makeAIMove = () => {
    const availableMoves: { boardIdx: number; cellIdx: number }[] = [];

    for (let b = 0; b < 9; b++) {
      if (boardWinners[b] !== null) continue;
      if (isBoardFull(boards[b])) continue;
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
      chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      // Try to win a mini board
      for (const move of availableMoves) {
        const testBoard = [...boards[move.boardIdx]];
        testBoard[move.cellIdx] = 'O';
        if (checkWinner(testBoard) === 'O') {
          chosenMove = move;
          break;
        }
      }

      // Try to block opponent's win
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

      // For hard mode, try to win the overall game
      if (!chosenMove && difficulty === 'hard') {
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

      // Prefer center cells, then corners
      if (!chosenMove) {
        const centerMoves = availableMoves.filter(m => m.cellIdx === 4);
        const cornerMoves = availableMoves.filter(m => [0, 2, 6, 8].includes(m.cellIdx));
        if (centerMoves.length > 0) {
          chosenMove = centerMoves[Math.floor(Math.random() * centerMoves.length)];
        } else if (cornerMoves.length > 0) {
          chosenMove = cornerMoves[Math.floor(Math.random() * cornerMoves.length)];
        } else {
          chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
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
      const timer = setTimeout(() => {
        makeAIMove();
        setIsAIThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, gameOver, showModeSelector]);

  // Handle cell press - following Ultimate Tic-Tac-Toe rules
  const handleCellPress = (boardIdx: number, cellIdx: number) => {
    if (gameOver || isAIThinking) return;
    if (activeBoard !== -1 && activeBoard !== boardIdx) return;
    if (boards[boardIdx][cellIdx] !== null) return;
    if (boardWinners[boardIdx] !== null) return;
    if (isBoardFull(boards[boardIdx])) return;

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

    // Check for draw
    if (isGameDraw(newBoardWinners, newBoards)) {
      setIsDraw(true);
      setGameOver(true);
      return;
    }

    // Determine next active board
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
    setIsDraw(false);
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
    if (gameWinner) return `🎉 Player ${gameWinner} wins!`;
    if (isDraw) return "It's a Draw!";
    if (isAIThinking) return 'AI thinking...';
    if (activeBoard === -1) return `Player ${currentPlayer}'s turn — any board`;
    return `Player ${currentPlayer}'s turn — Board ${activeBoard + 1}`;
  };

  // Check if a mini board is active (can be played)
  const isMiniBoardActive = (boardIdx: number): boolean => {
    if (gameOver) return false;
    if (boardWinners[boardIdx] !== null) return false;
    if (isBoardFull(boards[boardIdx])) return false;
    return activeBoard === -1 || activeBoard === boardIdx;
  };

  // Render a single cell
  const renderCell = (boardIdx: number, cellIdx: number, cell: CellValue, isActive: boolean) => {
    const row = Math.floor(cellIdx / 3);
    const col = cellIdx % 3;
    
    return (
      <TouchableOpacity
        key={cellIdx}
        style={[
          styles.cell,
          { width: CELL_SIZE, height: CELL_SIZE },
          col < 2 && { marginRight: CELL_GAP },
          row < 2 && { marginBottom: CELL_GAP },
        ]}
        onPress={() => handleCellPress(boardIdx, cellIdx)}
        disabled={!isActive || isAIThinking}
        activeOpacity={0.6}
      >
        {cell && (
          <Animatable.Text 
            animation="zoomIn" 
            duration={200}
            style={[
              styles.cellText,
              { color: cell === 'X' ? '#e11d48' : '#7c3aed', fontSize: CELL_SIZE * 0.55 }
            ]}
          >
            {cell}
          </Animatable.Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render a mini board
  const renderMiniBoard = (boardIdx: number) => {
    const isActive = isMiniBoardActive(boardIdx);
    const winner = boardWinners[boardIdx];
    const isFull = isBoardFull(boards[boardIdx]);
    const row = Math.floor(boardIdx / 3);
    const col = boardIdx % 3;

    return (
      <View
        key={boardIdx}
        style={[
          styles.miniBoard,
          { width: MINI_BOARD_SIZE, height: MINI_BOARD_SIZE },
          col < 2 && { marginRight: MINI_GAP },
          row < 2 && { marginBottom: MINI_GAP },
          isActive && !gameOver && styles.miniBoardActive,
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
            {[0, 1, 2].map(row => (
              <View key={row} style={styles.cellRow}>
                {[0, 1, 2].map(col => {
                  const cellIdx = row * 3 + col;
                  return renderCell(boardIdx, cellIdx, boards[boardIdx][cellIdx], isActive);
                })}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goHome} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>9×9 Ultimate</Text>
        <View style={styles.backButton} />
      </View>

      {/* Mode Selector Modal */}
      <Modal 
        visible={showModeSelector} 
        animationType="fade" 
        transparent 
        onRequestClose={goHome}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setShowModeSelector(false)}
          />
          <Animatable.View animation="zoomIn" style={styles.modeModal}>
            <Text style={styles.modeTitle}>Select Mode</Text>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => startGame('pvp')}
            >
              <Ionicons name="people" size={28} color={COLORS.secondary} />
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
        </View>
      </Modal>

      {/* Game Screen */}
      {!showModeSelector && (
        <View style={styles.gameArea}>
          <ScrollView 
            contentContainerStyle={styles.gameContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status */}
            <View style={styles.statusContainer}>
              <Text style={styles.status}>{getStatusText()}</Text>
              {activeBoard !== -1 && !gameOver && (
                <View style={styles.activeIndicator}>
                  <View style={[styles.activeIndicatorDot, { backgroundColor: ACTIVE_BORDER_COLOR }]} />
                  <Text style={styles.activeIndicatorText}>Active board highlighted in orange</Text>
                </View>
              )}
            </View>

            {/* Main Board */}
            <View style={[styles.mainBoard, { width: BOARD_OUTER_SIZE, height: BOARD_OUTER_SIZE }]}>
              <View style={styles.boardInner}>
                {[0, 1, 2].map(row => (
                  <View key={row} style={styles.boardRow}>
                    {[0, 1, 2].map(col => {
                      const boardIdx = row * 3 + col;
                      return renderMiniBoard(boardIdx);
                    })}
                  </View>
                ))}
              </View>
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
                <Ionicons name="grid" size={20} color={COLORS.secondary} />
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
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameArea: {
    flex: 1,
  },
  gameContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: BOARD_MARGIN,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  status: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  activeIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeIndicatorText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  mainBoard: {
    backgroundColor: '#4338ca',
    borderRadius: 10,
    padding: BOARD_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  boardInner: {
    // Contains the 3 rows of mini-boards
  },
  boardRow: {
    flexDirection: 'row',
  },
  miniBoard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 5,
    padding: MINI_PADDING,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBoardActive: {
    backgroundColor: ACTIVE_BG_COLOR,
    borderWidth: 2.5,
    borderColor: ACTIVE_BORDER_COLOR,
    padding: Math.max(MINI_PADDING - 1, 0),
  },
  miniBoardGrid: {
    width: GRID_SIZE,
    height: GRID_SIZE,
  },
  cellRow: {
    flexDirection: 'row',
  },
  cell: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#818cf8',
  },
  cellText: {
    fontWeight: 'bold',
  },
  winnerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerText: {
    fontSize: MINI_BOARD_SIZE * 0.55,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  gameInfoText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalDismissArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modeModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modeTitle: {
    fontSize: 22,
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
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 10,
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
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
});
