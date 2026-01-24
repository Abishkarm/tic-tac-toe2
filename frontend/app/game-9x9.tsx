import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Board9x9Component } from '../components/Board9x9';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { gameLogic9x9 } from '../utils/gameLogic';
import { useSettingsStore } from '../store/settingsStore';
import { soundManager } from '../utils/sounds';
import { COLORS, FONTS } from '../constants/theme';
import { Player } from '../types/game';
import * as Animatable from 'react-native-animatable';

export default function Game9x9Screen() {
  const router = useRouter();
  const { setLastPage, updateScore, triggerVibration, soundEnabled } = useSettingsStore();

  const [board, setBoard] = useState(gameLogic9x9.createEmptyBoard());
  const [smallBoards, setSmallBoards] = useState(gameLogic9x9.createEmptySmallBoards());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [activeBoard, setActiveBoard] = useState<number | null>(null);
  const [winner, setWinner] = useState<Player>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    setLastPage('/game-9x9');
    soundManager.setEnabled(soundEnabled);
  }, []);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleCellPress = (boardIndex: number, cellIndex: number) => {
    if (winner || isDraw) return;

    // Validate move
    if (!gameLogic9x9.isValidMove(board, smallBoards, activeBoard, boardIndex, cellIndex)) {
      Alert.alert(
        'Invalid Move',
        activeBoard !== null
          ? `You must play in the highlighted board (${activeBoard + 1})`
          : 'This cell is not available'
      );
      return;
    }

    // Make move
    const newBoard = gameLogic9x9.makeMove(board, boardIndex, cellIndex, currentPlayer);
    setBoard(newBoard);
    triggerVibration();
    soundManager.playMove();

    // Check if small board is won
    const newSmallBoards = [...smallBoards];
    const smallBoardWinner = gameLogic9x9.checkSmallBoardWinner(newBoard[boardIndex]);
    if (smallBoardWinner) {
      newSmallBoards[boardIndex] = smallBoardWinner;
      setSmallBoards(newSmallBoards);

      // Check for game winner
      const gameWinner = gameLogic9x9.checkGameWinner(newSmallBoards);
      if (gameWinner) {
        setWinner(gameWinner);
        updateScore(gameWinner);
        soundManager.playWin();
        triggerVibration();
        return;
      }
    }

    // Set next active board
    const nextActiveBoard = gameLogic9x9.getNextActiveBoard(cellIndex, newSmallBoards, newBoard);
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
  };

  const getStatusText = () => {
    if (winner) return `Player ${winner} Wins!`;
    if (isDraw) return "It's a Draw!";
    if (activeBoard !== null) {
      return `Player ${currentPlayer}'s Turn - Board ${activeBoard + 1}`;
    }
    return `Player ${currentPlayer}'s Turn - Choose any board`;
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
            style={[styles.headerButton, { marginRight: 8 }]}
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

      <ScrollView contentContainerStyle={styles.gameContent}>
        {/* Rules */}
        {showRules && (
          <Animatable.View animation="fadeIn" style={styles.rulesContainer}>
            <View style={styles.rulesHeader}>
              <Text style={styles.rulesTitle}>How to Play</Text>
              <TouchableOpacity onPress={() => setShowRules(false)}>
                <Ionicons name="close" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.rulesText}>
              • Win small 3x3 boards to claim them{' \n'}
              • Your move determines which board your opponent plays next{' \n'}
              • Win 3 small boards in a row to win the game{' \n'}
              • If sent to a won/full board, you can choose any board
            </Text>
          </Animatable.View>
        )}

        {/* Score Display */}
        <ScoreDisplay />

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
            disabled={winner !== null || isDraw}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Ionicons name="refresh" size={24} color={COLORS.cardBg} />
            <Text style={styles.resetButtonText}>New Game</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    paddingHorizontal: 20,
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
  statusText: {
    fontSize: FONTS.sizes.large,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  boardContainer: {
    marginBottom: 24,
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
});
