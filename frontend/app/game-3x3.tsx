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

type GameVariant = 'classic' | 'disappearing';

export default function Game3x3Screen() {
  const router = useRouter();
  const { setLastPage, updateScore, triggerVibration, soundEnabled, showReplayButton } = useSettingsStore();
  const { addMove, undoLastMove, clearHistory, canUndo, getMoveHistory } = useGameStore();

  const [board, setBoard] = useState(gameLogic3x3.createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [isDraw, setIsDraw] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [gameMode, setGameMode] = useState<MultiplayerMode>('local');
  const [gameVariant, setGameVariant] = useState<GameVariant>('classic');
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [modeSelectorTab, setModeSelectorTab] = useState<'pvp' | 'ai'>('pvp');

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

  const applyDisappearingMode = (newBoard: any[], moveHistory: any[]) => {
    if (gameVariant !== 'disappearing' || moveHistory.length <= 6) {
      return newBoard;
    }

    // Only keep the last 6 moves on the board
    const boardCopy = [...newBoard];
    const recentMoves = moveHistory.slice(-6);
    
    // Clear all cells
    for (let i = 0; i < boardCopy.length; i++) {
      boardCopy[i] = null;
    }
    
    // Re-apply only the last 6 moves
    recentMoves.forEach((move: any) => {
      boardCopy[move.index] = move.player;
    });
    
    return boardCopy;
  };

  const handleCellPress = (index: number) => {
    if (board[index] !== null || winner || isDraw || isAIThinking) return;

    let newBoard = gameLogic3x3.makeMove(board, index, currentPlayer);
    addMove(index, currentPlayer);
    
    const currentHistory = getMoveHistory();
    
    // Apply disappearing mode if enabled
    if (gameVariant === 'disappearing') {
      newBoard = applyDisappearingMode(newBoard, currentHistory);
    }
    
    setBoard(newBoard);
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
    if (gameVariant === 'classic' && gameLogic3x3.checkDraw(newBoard)) {
      setIsDraw(true);
      updateScore('draw');
      soundManager.playDraw();
      return;
    }

    // Switch player
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const handleUndo = () => {
    if (!canUndo || winner || isDraw) return;
    
    const lastMove = undoLastMove();
    if (!lastMove) return;

    const currentHistory = getMoveHistory();
    let newBoard = gameLogic3x3.createEmptyBoard();
    
    // Rebuild board from remaining history
    currentHistory.forEach(move => {
      newBoard[move.index] = move.player;
    });
    
    // Apply disappearing mode if needed
    if (gameVariant === 'disappearing') {
      newBoard = applyDisappearingMode(newBoard, currentHistory);
    }
    
    setBoard(newBoard);
    setCurrentPlayer(lastMove.player);
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

  const handleModeSelection = (mode: MultiplayerMode, variant: GameVariant, diff?: Difficulty) => {
    setGameMode(mode);
    setGameVariant(variant);
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
      <Modal visible={showModeSelector} animationType="fade" transparent={true} onRequestClose={() => router.push('/')}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => router.push('/')}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animatable.View animation="zoomIn" style={styles.modeSelector}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <Text style={styles.modeSelectorTitle}>Select Game Mode</Text>

                {/* Top Tab Switcher */}
                <View style={styles.tabSwitcher}>
                  <TouchableOpacity
                    style={[styles.tab, modeSelectorTab === 'pvp' && styles.tabActive]}
                    onPress={() => setModeSelectorTab('pvp')}
                  >
                    <Ionicons 
                      name="people" 
                      size={24} 
                      color={modeSelectorTab === 'pvp' ? COLORS.cardBg : COLORS.text} 
                    />
                    <Text style={[styles.tabText, modeSelectorTab === 'pvp' && styles.tabTextActive]}>
                      PvP
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, modeSelectorTab === 'ai' && styles.tabActive]}
                    onPress={() => setModeSelectorTab('ai')}
                  >
                    <Ionicons 
                      name="phone-portrait" 
                      size={24} 
                      color={modeSelectorTab === 'ai' ? COLORS.cardBg : COLORS.text} 
                    />
                    <Text style={[styles.tabText, modeSelectorTab === 'ai' && styles.tabTextActive]}>
                      Player vs AI
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* PvP Section */}
                {modeSelectorTab === 'pvp' && (
                  <Animatable.View animation="fadeIn" style={styles.tabContent}>
                    <TouchableOpacity
                      style={styles.modeCard}
                      onPress={() => handleModeSelection('local', 'classic')}
                    >
                      <Ionicons name="grid-outline" size={40} color={COLORS.secondary} />
                      <Text style={styles.modeCardTitle}>Classic</Text>
                      <Text style={styles.modeCardSubtitle}>Standard rules</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modeCard}
                      onPress={() => handleModeSelection('local', 'disappearing')}
                    >
                      <Ionicons name="hourglass-outline" size={40} color={COLORS.accent} />
                      <Text style={styles.modeCardTitle}>Disappearing</Text>
                      <Text style={styles.modeCardSubtitle}>Last 6 moves only</Text>
                    </TouchableOpacity>
                  </Animatable.View>
                )}

                {/* Player vs AI Section */}
                {modeSelectorTab === 'ai' && (
                  <Animatable.View animation="fadeIn" style={styles.tabContent}>
                    {/* Easy */}
                    <View style={styles.aiRow}>
                      <Text style={styles.aiRowLabel}>Easy</Text>
                      <View style={styles.aiRowButtons}>
                        <TouchableOpacity
                          style={styles.variantButton}
                          onPress={() => handleModeSelection('ai', 'classic', 'easy')}
                        >
                          <Ionicons name="grid-outline" size={20} color={COLORS.secondary} />
                          <Text style={styles.variantButtonText}>Classic</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.variantButton}
                          onPress={() => handleModeSelection('ai', 'disappearing', 'easy')}
                        >
                          <Ionicons name="hourglass-outline" size={20} color={COLORS.accent} />
                          <Text style={styles.variantButtonText}>Disappearing</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Medium */}
                    <View style={styles.aiRow}>
                      <Text style={styles.aiRowLabel}>Medium</Text>
                      <View style={styles.aiRowButtons}>
                        <TouchableOpacity
                          style={styles.variantButton}
                          onPress={() => handleModeSelection('ai', 'classic', 'medium')}
                        >
                          <Ionicons name="grid-outline" size={20} color={COLORS.secondary} />
                          <Text style={styles.variantButtonText}>Classic</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.variantButton}
                          onPress={() => handleModeSelection('ai', 'disappearing', 'medium')}
                        >
                          <Ionicons name="hourglass-outline" size={20} color={COLORS.accent} />
                          <Text style={styles.variantButtonText}>Disappearing</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Hard */}
                    <View style={styles.aiRow}>
                      <Text style={styles.aiRowLabel}>Hard</Text>
                      <View style={styles.aiRowButtons}>
                        <TouchableOpacity
                          style={styles.variantButton}
                          onPress={() => handleModeSelection('ai', 'classic', 'hard')}
                        >
                          <Ionicons name="grid-outline" size={20} color={COLORS.secondary} />
                          <Text style={styles.variantButtonText}>Classic</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.variantButton}
                          onPress={() => handleModeSelection('ai', 'disappearing', 'hard')}
                        >
                          <Ionicons name="hourglass-outline" size={20} color={COLORS.accent} />
                          <Text style={styles.variantButtonText}>Disappearing</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Animatable.View>
                )}
              </ScrollView>
            </Animatable.View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {!showModeSelector && (
        <ScrollView contentContainerStyle={styles.gameContent}>
          {/* Score Display */}
          <ScoreDisplay />

          {/* Game Mode Indicator */}
          <View style={styles.gameModeIndicator}>
            <Ionicons 
              name={gameVariant === 'classic' ? 'grid-outline' : 'hourglass-outline'} 
              size={20} 
              color={gameVariant === 'classic' ? COLORS.secondary : COLORS.accent} 
            />
            <Text style={styles.gameModeText}>
              {gameVariant === 'classic' ? 'Classic Mode' : 'Disappearing Mode'}
            </Text>
            {gameMode === 'ai' && (
              <Text style={styles.difficultyBadge}>{difficulty.toUpperCase()}</Text>
            )}
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
              {gameMode === 'local' ? 'Player vs Player' : `vs AI (${difficulty})`}
            </Text>
            <Text style={styles.gameInfoText}>
              Moves: {getMoveHistory().length}
            </Text>
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
  gameModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  gameModeText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.text,
    fontWeight: '600',
  },
  difficultyBadge: {
    fontSize: FONTS.sizes.small,
    color: COLORS.warning,
    fontWeight: 'bold',
    marginLeft: 4,
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
    maxHeight: '90%',
  },
  modeSelectorTitle: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: COLORS.secondary,
  },
  tabText: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabTextActive: {
    color: COLORS.cardBg,
  },
  tabContent: {
    gap: 16,
  },
  modeCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
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
  aiRow: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  aiRowLabel: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  aiRowButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  variantButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  variantButtonText: {
    fontSize: FONTS.sizes.small,
    fontWeight: '600',
    color: COLORS.text,
  },
});
