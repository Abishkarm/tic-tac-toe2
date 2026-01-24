import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Cell } from './Cell';
import { Player, Board9x9 } from '../types/game';
import { COLORS, SIZES } from '../constants/theme';

interface Board9x9Props {
  board: Board9x9;
  smallBoards: Player[];
  activeBoard: number | null;
  onCellPress: (boardIndex: number, cellIndex: number) => void;
  disabled?: boolean;
}

export const Board9x9Component: React.FC<Board9x9Props> = ({
  board,
  smallBoards,
  activeBoard,
  onCellPress,
  disabled = false,
}) => {
  const renderSmallBoard = (boardIndex: number) => {
    const smallBoard = board[boardIndex];
    const isWon = smallBoards[boardIndex] !== null;
    const isActive = activeBoard === null || activeBoard === boardIndex;
    const winner = smallBoards[boardIndex];

    return (
      <View
        key={boardIndex}
        style={[
          styles.smallBoard,
          isActive && !isWon && styles.smallBoardActive,
          isWon && styles.smallBoardWon,
        ]}
      >
        {isWon ? (
          <View style={styles.winnerOverlay}>
            <Text style={[styles.winnerText, { color: winner === 'X' ? COLORS.playerX : COLORS.playerO }]}>
              {winner}
            </Text>
          </View>
        ) : (
          smallBoard.map((cell, cellIndex) => (
            <Cell
              key={cellIndex}
              value={cell}
              onPress={() => onCellPress(boardIndex, cellIndex)}
              disabled={disabled || !isActive || isWon}
              size={SIZES.cellSize9x9}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {Array.from({ length: 9 }).map((_, index) => renderSmallBoard(index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: (SIZES.cellSize9x9 * 3 + 4) * 3 + 12,
    gap: 6,
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 12,
  },
  smallBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: SIZES.cellSize9x9 * 3 + 4,
    height: SIZES.cellSize9x9 * 3 + 4,
    gap: 2,
    backgroundColor: COLORS.cardBg,
    padding: 2,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  smallBoardActive: {
    borderWidth: 3,
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.cellActive,
  },
  smallBoardWon: {
    backgroundColor: COLORS.background,
  },
  winnerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  winnerText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
});
