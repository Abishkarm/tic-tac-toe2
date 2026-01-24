import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Board9x9Component } from '../components/Board9x9';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { gameLogic9x9 } from '../utils/gameLogic';
import { aiEngine } from '../utils/aiEngine';
import { useSettingsStore } from '../store/settingsStore';
import { soundManager } from '../utils/sounds';
import { COLORS, FONTS } from '../constants/theme';
import { Player, Difficulty } from '../types/game';
import * as Animatable from 'react-native-animatable';

type GameMode = 'pvp' | 'ai';

export default function Game9x9Screen() {
  const router = useRouter();
  const { setLastPage, updateScore, triggerVibration, soundEnabled } = useSettingsStore();

  // Game state
  const [board, setBoard] = useState(gameLogic9x9.createEmptyBoard());
  const [smallBoards, setSmallBoards] = useState(gameLogic9x9.createEmptySmallBoards());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [activeBoard, setActiveBoard] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  // UI state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('pvp');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [isAIThinking, setIsAIThinking] = useState(false);

  useEffect(() => {
    setLastPage('/game-9x9');
    soundManager.setEnabled(soundEnabled);
  }, []);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // AI move logic (simplified for 9x9)
  useEffect(() => {
    if (
      gameMode === 'ai' &&
      currentPlayer === 'O' &&
      !winner &&
      !isDraw &&
      !showModeSelector &&
      !isAIThinking
    ) {
      setIsAIThinking(true);
      setTimeout(() => {
        makeAIMove();
        setIsAIThinking(false);
      }, 800);
    }
  }, [currentPlayer, gameMode, winner, isDraw, showModeSelector]);

  const makeAIMove = () => {
    // Get available moves
    const availableMoves: { boardIndex: number; cellIndex: number }[] = [];
    
    for (let boardIdx = 0; boardIdx < 9; boardIdx++) {
      // Skip if board is won
      if (smallBoards[boardIdx] !== null) continue;
      
      // Skip if not the active board (unless activeBoard is null)
      if (activeBoard !== null && activeBoard !== boardIdx) continue;
      
      for (let cellIdx = 0; cellIdx < 9; cellIdx++) {
        if (board[boardIdx][cellIdx] === null) {
          availableMoves.push({ boardIndex: boardIdx, cellIndex: cellIdx });
        }
      }
    }

    if (availableMoves.length === 0) return;

    // Simple AI: Random move (can be enhanced with minimax for small boards)
    let move;
    if (difficulty === 'easy') {
      // Pure random
      move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    } else {
      // Try to win a mini-board first
      for (const testMove of availableMoves) {
        const testBoard = [...board[testMove.boardIndex]];
        testBoard[testMove.cellIndex] = 'O';
        if (gameLogic9x9.checkSmallBoardWinner(testBoard) === 'O') {
          move = testMove;
          break;
        }
      }
      
      // If no winning move, try to block opponent
      if (!move) {
        for (const testMove of availableMoves) {
          const testBoard = [...board[testMove.boardIndex]];
          testBoard[testMove.cellIndex] = 'X';
          if (gameLogic9x9.checkSmallBoardWinner(testBoard) === 'X') {
            move = testMove;
            break;
          }
        }
      }
      
      // Otherwise random
      if (!move) {
        move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      }
    }

    handleCellPress(move.boardIndex, move.cellIndex);
  };

  const handleCellPress = (boardIndex: number, cellIndex: number) => {
    if (winner || isDraw || isAIThinking) return;

    // Validate move according to Ultimate Tic-Tac-Toe rules
    const isValid = gameLogic9x9.isValidMove(
      board,
      smallBoards,
      activeBoard,
      boardIndex,
      cellIndex
    );

    if (!isValid) {
      if (activeBoard !== null && activeBoard !== boardIndex) {
        Alert.alert(
          'Invalid Move',
          `You must play in board ${activeBoard + 1} (highlighted in blue)`
        );
      }
      return;
    }

    // Make the move
    const newBoard = gameLogic9x9.makeMove(board, boardIndex, cellIndex, currentPlayer);
    setBoard(newBoard);
    setMoveCount(moveCount + 1);
    triggerVibration();
    soundManager.playMove();

    // Check if this move won the small board
    const newSmallBoards = [...smallBoards];
    const smallBoardWinner = gameLogic9x9.checkSmallBoardWinner(newBoard[boardIndex]);
    
    if (smallBoardWinner && !newSmallBoards[boardIndex]) {
      newSmallBoards[boardIndex] = smallBoardWinner;
      setSmallBoards(newSmallBoards);

      // Check for overall game winner
      const gameWinner = gameLogic9x9.checkGameWinner(newSmallBoards);
      if (gameWinner) {
        setWinner(gameWinner);
        updateScore(gameWinner);
        soundManager.playWin();
        triggerVibration();
        return;
      }
    }

    // Determine next active board based on cell position
    const nextActiveBoard = gameLogic9x9.getNextActiveBoard(
      cellIndex,
      newSmallBoards,
      newBoard
    );
    setActiveBoard(nextActiveBoard);

    // Switch player
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const resetGame = () => {
    setBoard(gameLogic9x9.createEmptyBoard());
    setSmallBoards(gameLogic9x9.createEmptySmallBoards());
    setCurrentPlayer('X');
    setActiveBoard(null);
    setWinner(null);
    setIsDraw(false);
    setMoveCount(0);
  };

  const handleModeSelection = (mode: GameMode, diff?: Difficulty) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    setShowModeSelector(false);
    resetGame();
  };

  const handleBackToMenu = () => {
    setShowModeSelector(true);
    resetGame();
  };

  const getStatusText = () => {
    if (winner) return `Player ${winner} Wins! 🎉`;
    if (isDraw) return "It's a Draw!";
    if (isAIThinking) return 'AI is thinking...';
    
    if (activeBoard !== null) {
      return `Player ${currentPlayer} - Play in Board ${activeBoard + 1}`;
    }
    return `Player ${currentPlayer} - Choose any board`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>9x9 Ultimate</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setShowRules(!showRules)}
            style={styles.headerButton}
          >
            <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSettingsVisible(true)}
            style={styles.headerButton}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Selection Modal */}
      <Modal visible={showModeSelector} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" style={styles.modeSelector}>
            <Text style={styles.modeSelectorTitle}>Select Game Mode</Text>

            {/* Player vs Player */}
            <TouchableOpacity
              style={styles.modeCard}
              onPress={() => handleModeSelection('pvp')}
            >
              <Ionicons name="people" size={40} color={COLORS.secondary} />
              <Text style={styles.modeCardTitle}>Player vs Player</Text>
              <Text style={styles.modeCardSubtitle}>Local multiplayer</Text>
            </TouchableOpacity>

            {/* AI Options */}
            <Text style={styles.aiSectionTitle}>Player vs AI</Text>
            
            <View style={styles.aiButtons}>
              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => handleModeSelection('ai', 'easy')}
              >
                <Text style={styles.aiButtonText}>Easy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => handleModeSelection('ai', 'medium')}
              >
                <Text style={styles.aiButtonText}>Medium</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aiButton}
                onPress={() => handleModeSelection('ai', 'hard')}
              >
                <Text style={styles.aiButtonText}>Hard</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>

      {!showModeSelector && (
        <ScrollView contentContainerStyle={styles.gameContent}>
          {/* Rules Panel */}
          {showRules && (
            <Animatable.View animation="fadeIn" style={styles.rulesContainer}>
              <View style={styles.rulesHeader}>
                <Text style={styles.rulesTitle}>Ultimate Tic-Tac-Toe Rules</Text>
                <TouchableOpacity onPress={() => setShowRules(false)}>
                  <Ionicons name="close" size={20} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
              <Text style={styles.rulesText}>
                • First move: Play in any cell{'\n'}
                • Your cell position sends opponent to that board{'\n'}
                • Win 3-in-a-row in a mini-board to claim it{'\n'}
                • Win 3 mini-boards in a row to win the game{'\n'}
                • If sent to won/full board, play anywhere
              </Text>
            </Animatable.View>
          )}

          {/* Score Display */}
          <ScoreDisplay />

          {/* Game Mode Indicator */}
          <View style={styles.gameModeIndicator}>
            <Text style={styles.gameModeText}>
              {gameMode === 'pvp' ? 'Player vs Player' : `vs AI (${difficulty})`}
            </Text>
          </View>

          {/* Status */}
          <Animatable.View animation={winner || isDraw ? 'pulse' : undefined}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </Animatable.View>

          {/* Game Board */}
          <View style={styles.boardContainer}>
            <Board9x9Component
              board={board}
              smallBoards={smallBoards}
              activeBoard={activeBoard}
              onCellPress={handleCellPress}
              disabled={winner !== null || isDraw || isAIThinking}
            />
          </View>

          {/* Move Counter */}
          <Text style={styles.moveCounter}>Moves: {moveCount}</Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Ionicons name="refresh" size={24} color={COLORS.cardBg} />
              <Text style={styles.resetButtonText}>New Game</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton} onPress={handleBackToMenu}>
              <Ionicons name="grid" size={24} color={COLORS.secondary} />
              <Text style={styles.menuButtonText}>Change Mode</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Settings Drawer */}
      <SettingsDrawer visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  gameContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  rulesContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  rulesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rulesTitle: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  rulesText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  gameModeIndicator: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
  },
  gameModeText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text,
    fontWeight: '600',
  },
  statusText: {
    fontSize: FONTS.sizes.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  boardContainer: {
    marginBottom: 16,
  },
  moveCounter: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  resetButtonText: {
    color: COLORS.cardBg,
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  menuButtonText: {
    color: COLORS.secondary,
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modeSelector: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
  },
  modeSelectorTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modeCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  modeCardTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
  },
  modeCardSubtitle: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    marginTop: 4,
  },
  aiSectionTitle: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  aiButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  aiButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  aiButtonText: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
});
