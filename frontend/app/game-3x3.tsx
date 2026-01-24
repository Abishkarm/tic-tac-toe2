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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Board3x3Component } from '../components/Board3x3';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { gameLogic3x3 } from '../utils/gameLogic';
import { aiEngine } from '../utils/aiEngine';
import { useSettingsStore } from '../store/settingsStore';
import { useGameStore } from '../store/gameStore';
import { soundManager } from '../utils/sounds';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { Player, Difficulty, MultiplayerMode } from '../types/game';
import * as Animatable from 'react-native-animatable';

export default function Game3x3Screen() {
  const router = useRouter();
  const { setLastPage, updateScore, triggerVibration, soundEnabled, showReplayButton } = useSettingsStore();
  const { addMove, undoLastMove, clearHistory, canUndo } = useGameStore();

  const [board, setBoard] = useState(gameLogic3x3.createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [isDraw, setIsDraw] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [gameMode, setGameMode] = useState<MultiplayerMode>('local');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [disappearingMode, setDisappearingMode] = useState(false);

  useEffect(() => {
    setLastPage('/game-3x3');
    soundManager.setEnabled(soundEnabled);
  }, []);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // AI move logic
  useEffect(() => {
    if (
      gameMode === 'ai' &&
      currentPlayer === 'O' &&
      !winner &&
      !isDraw &&
      !showModeSelector
    ) {
      setIsAIThinking(true);
      setTimeout(() => {
        const aiMove = aiEngine.getMove(board, difficulty);
        handleCellPress(aiMove);
        setIsAIThinking(false);
      }, 500);
    }
  }, [currentPlayer, gameMode, winner, isDraw, showModeSelector]);

  const handleCellPress = (index: number) => {
    if (board[index] !== null || winner || isDraw || isAIThinking) return;

    const newBoard = gameLogic3x3.makeMove(board, index, currentPlayer);
    setBoard(newBoard);
    addMove(index, currentPlayer, newBoard);
    triggerVibration();
    soundManager.playMove();

    // Check for winner
    const gameWinner = gameLogic3x3.checkWinner(newBoard);
    if (gameWinner) {
      const line = gameLogic3x3.getWinningLine(newBoard);
      setWinningLine(line || []);
      setWinner(gameWinner);
      updateScore(gameWinner);
      soundManager.playWin();
      triggerVibration();
      return;
    }

    // Check for draw
    if (gameLogic3x3.checkDraw(newBoard)) {
      setIsDraw(true);
      updateScore('draw');
      soundManager.playDraw();
      return;
    }

    // Switch player
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const handleUndo = () => {
    const lastMove = undoLastMove();
    if (!lastMove) return;

    // Get the previous board state (before the last move)
    const previousMove = undoLastMove();
    
    if (previousMove) {
      setBoard(previousMove.boardState);
      setCurrentPlayer(previousMove.player === 'X' ? 'O' : 'X');
      addMove(previousMove.index, previousMove.player, previousMove.boardState);
    } else {
      // If no previous move, reset to empty board
      setBoard(gameLogic3x3.createEmptyBoard());
      setCurrentPlayer('X');
    }

    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);
    triggerVibration();
  };

  const resetGame = () => {
    setBoard(gameLogic3x3.createEmptyBoard());
    setCurrentPlayer('X');
    setWinner(null);
    setWinningLine([]);
    setIsDraw(false);
    clearHistory();
  };

  const handleModeSelection = (mode: MultiplayerMode, diff?: Difficulty) => {
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
    return `Player ${currentPlayer}'s Turn`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>3x3 Tic-Tac-Toe</Text>
        <TouchableOpacity
          onPress={() => setSettingsVisible(true)}
          style={styles.headerButton}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Mode Selection Modal */}
      <Modal visible={showModeSelector} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" style={styles.modeSelector}>
            <Text style={styles.modeSelectorTitle}>Select Game Mode</Text>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => handleModeSelection('local')}
            >
              <Ionicons name="people" size={32} color={COLORS.secondary} />
              <Text style={styles.modeButtonText}>Player vs Player</Text>
              <Text style={styles.modeButtonSubtext}>Local multiplayer</Text>
            </TouchableOpacity>

            <View style={styles.aiSection}>
              <Text style={styles.aiSectionTitle}>Player vs AI</Text>
              
              <TouchableOpacity
                style={[styles.modeButton, styles.difficultyButton]}
                onPress={() => handleModeSelection('ai', 'easy')}
              >
                <Text style={styles.difficultyButtonText}>Easy</Text>
                <Text style={styles.difficultySubtext}>Good for beginners</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, styles.difficultyButton]}
                onPress={() => handleModeSelection('ai', 'medium')}
              >
                <Text style={styles.difficultyButtonText}>Medium</Text>
                <Text style={styles.difficultySubtext}>Challenging</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, styles.difficultyButton]}
                onPress={() => handleModeSelection('ai', 'hard')}
              >
                <Text style={styles.difficultyButtonText}>Hard</Text>
                <Text style={styles.difficultySubtext}>Unbeatable AI</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>

      {!showModeSelector && (
        <ScrollView contentContainerStyle={styles.gameContent}>
          {/* Score Display */}
          <ScoreDisplay />

          {/* Game Options */}
          <View style={styles.optionsContainer}>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Disappearing Mode</Text>
              <Switch
                value={disappearingMode}
                onValueChange={setDisappearingMode}
                trackColor={{ false: COLORS.border, true: COLORS.secondary }}
                thumbColor={COLORS.cardBg}
              />
            </View>
          </View>

          {/* Status */}
          <Animatable.View animation={winner || isDraw ? 'pulse' : undefined}>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </Animatable.View>

          {/* Game Board */}
          <View style={styles.boardContainer}>
            <Board3x3Component
              board={board}
              onCellPress={handleCellPress}
              disabled={winner !== null || isDraw || isAIThinking}
              winningLine={winningLine}
              disappearingMode={disappearingMode}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Ionicons name="refresh" size={24} color={COLORS.cardBg} />
              <Text style={styles.resetButtonText}>New Game</Text>
            </TouchableOpacity>

            {showReplayButton && (
              <TouchableOpacity
                style={[styles.undoButton, !canUndo && styles.undoButtonDisabled]}
                onPress={handleUndo}
                disabled={!canUndo || winner !== null || isDraw}
              >
                <Ionicons name="arrow-undo" size={24} color={!canUndo || winner || isDraw ? COLORS.textLight : COLORS.warning} />
                <Text style={[styles.undoButtonText, (!canUndo || winner || isDraw) && styles.undoButtonTextDisabled]}>Undo</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuButton} onPress={handleBackToMenu}>
              <Ionicons name="grid" size={24} color={COLORS.secondary} />
              <Text style={styles.menuButtonText}>Change Mode</Text>
            </TouchableOpacity>
          </View>

          {/* Game Info */}
          <View style={styles.gameInfo}>
            <Text style={styles.gameInfoText}>
              Mode: {gameMode === 'local' ? 'Player vs Player' : `AI (${difficulty})`}
            </Text>
            {disappearingMode && (
              <Text style={styles.gameInfoText}>Disappearing Mode Active</Text>
            )}
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
  headerTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  gameContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  optionsContainer: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
    fontWeight: '500',
  },
  statusText: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  boardContainer: {
    marginBottom: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    justifyContent: 'center',
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
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  undoButtonDisabled: {
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  undoButtonText: {
    color: COLORS.warning,
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
  },
  undoButtonTextDisabled: {
    color: COLORS.textLight,
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
  gameInfo: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  gameInfoText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    textAlign: 'center',
    marginVertical: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modeSelector: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modeSelectorTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  modeButton: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  modeButtonText: {
    fontSize: FONTS.sizes.large,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  modeButtonSubtext: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    marginTop: 4,
  },
  aiSection: {
    marginTop: 12,
  },
  aiSectionTitle: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 12,
    textAlign: 'center',
  },
  difficultyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyButtonText: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  difficultySubtext: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
  },
});
