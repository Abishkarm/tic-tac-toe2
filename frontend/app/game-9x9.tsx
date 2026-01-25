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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS } from '../constants/theme';
import * as Animatable from 'react-native-animatable';

type CellValue = 'X' | 'O' | null;
type Board = CellValue[];
type GameMode = 'pvp' | 'ai';
type Difficulty = 'easy' | 'medium' | 'hard';

// Ultimate 9x9 Game Component
export default function Game9x9Ultimate() {
  const router = useRouter();

  // 9 mini boards (each with 9 cells)
  const [boards, setBoards] = useState<Board[]>(
    Array(9).fill(null).map(() => Array(9).fill(null))
  );
  
  // Track which mini boards are won ('X', 'O', or null)
  const [boardWinners, setBoardWinners] = useState<CellValue[]>(Array(9).fill(null));
  
  // Current player
  const [currentPlayer, setCurrentPlayer] = useState<CellValue>('X');
  
  // Which mini board must be played in (null = any board)
  const [activeBoard, setActiveBoard] = useState<number | null>(null);
  
  // Overall game winner
  const [gameWinner, setGameWinner] = useState<CellValue>(null);
  
  // UI state
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);

  // Check if 3 in a row (for mini board or overall game)
  const checkWinner = (cells: CellValue[]): CellValue => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
        return cells[a];
      }
    }
    return null;
  };

  // Check if board is full
  const isBoardFull = (board: Board): boolean => {
    return board.every(cell => cell !== null);
  };

  // AI makes a move
  const makeAIMove = () => {
    const availableMoves: { boardIdx: number; cellIdx: number }[] = [];

    // Find all available moves
    for (let b = 0; b < 9; b++) {
      // Skip won boards
      if (boardWinners[b] !== null) continue;
      
      // Skip inactive boards (if activeBoard is set)
      if (activeBoard !== null && activeBoard !== b) continue;

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

      // 3. Random if no critical move
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
    if (gameMode === 'ai' && currentPlayer === 'O' && !gameWinner && !showModeSelector) {
      setIsAIThinking(true);
      setTimeout(() => {
        makeAIMove();
        setIsAIThinking(false);
      }, 600);
    }
  }, [currentPlayer, gameMode, gameWinner, showModeSelector]);

  // Handle cell press
  const handleCellPress = (boardIdx: number, cellIdx: number) => {
    // Validation
    if (gameWinner || isAIThinking) return;
    if (boardWinners[boardIdx] !== null) return; // Board already won
    if (boards[boardIdx][cellIdx] !== null) return; // Cell occupied
    if (activeBoard !== null && activeBoard !== boardIdx) {
      Alert.alert('Invalid Move', `You must play in board ${activeBoard + 1}`);
      return;
    }

    // Make move
    const newBoards = boards.map((board, idx) =>
      idx === boardIdx ? board.map((cell, i) => (i === cellIdx ? currentPlayer : cell)) : [...board]
    );
    setBoards(newBoards);

    // Check if mini board is won
    const miniWinner = checkWinner(newBoards[boardIdx]);
    if (miniWinner) {
      const newBoardWinners = [...boardWinners];
      newBoardWinners[boardIdx] = miniWinner;
      setBoardWinners(newBoardWinners);

      // Check overall game winner
      const overallWinner = checkWinner(newBoardWinners);
      if (overallWinner) {
        setGameWinner(overallWinner);
        return;
      }
    }

    // Determine next active board
    const nextBoard = cellIdx;
    if (boardWinners[nextBoard] !== null || isBoardFull(newBoards[nextBoard])) {
      setActiveBoard(null); // Any board available
    } else {
      setActiveBoard(nextBoard);
    }

    // Switch player
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  // Reset game
  const resetGame = () => {
    setBoards(Array(9).fill(null).map(() => Array(9).fill(null)));
    setBoardWinners(Array(9).fill(null));
    setCurrentPlayer('X');
    setActiveBoard(null);
    setGameWinner(null);
  };

  // Start game with mode
  const startGame = (mode: GameMode, diff?: Difficulty) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    setShowModeSelector(false);
    resetGame();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2f3b4c" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>9x9 Ultimate</Text>
        <View style={styles.backButton} />
      </View>

      {/* Mode Selector */}
      <Modal visible={showModeSelector} animationType="fade" transparent onRequestClose={() => setShowModeSelector(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowModeSelector(false)}
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
          <Text style={styles.status}>
            {gameWinner
              ? `${gameWinner} Wins! 🎉`
              : isAIThinking
              ? 'AI thinking...'
              : activeBoard !== null
              ? `${currentPlayer}'s turn - Board ${activeBoard + 1}`
              : `${currentPlayer}'s turn - Any board`}
          </Text>

          {/* Game Board */}
          <View style={styles.mainBoard}>
            {boards.map((miniBoard, boardIdx) => {
              const isActive = activeBoard === null || activeBoard === boardIdx;
              const winner = boardWinners[boardIdx];

              return (
                <View
                  key={boardIdx}
                  style={[
                    styles.miniBoard,
                    isActive && !winner && styles.miniBoardActive,
                  ]}
                >
                  {winner ? (
                    <View style={styles.winnerOverlay}>
                      <Text style={styles.winnerText}>{winner}</Text>
                    </View>
                  ) : (
                    miniBoard.map((cell, cellIdx) => (
                      <TouchableOpacity
                        key={cellIdx}
                        style={styles.cell}
                        onPress={() => handleCellPress(boardIdx, cellIdx)}
                        disabled={!isActive || winner !== null || isAIThinking}
                      >
                        {cell && (
                          <Animatable.Text animation="zoomIn" style={styles.cellText}>
                            {cell}
                          </Animatable.Text>
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              );
            })}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.button} onPress={resetGame}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.buttonText}>New Game</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setShowModeSelector(true)}
            >
              <Ionicons name="settings" size={20} color={COLORS.secondary} />
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Change Mode</Text>
            </TouchableOpacity>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  status: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  mainBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 375,
    gap: 7,
    backgroundColor: '#2f3b4c',
    padding: 7,
    borderRadius: 12,
  },
  miniBoard: {
    width: 115,
    height: 115,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  miniBoardActive: {
    borderWidth: 3,
    borderColor: '#60a5fa',
    padding: 5,
  },
  cell: {
    width: 31,
    height: 31,
    backgroundColor: '#fff',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  winnerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 231, 235, 0.95)',
  },
  winnerText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
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
