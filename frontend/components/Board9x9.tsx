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
    width: 360,
    gap: 14,
    backgroundColor: '#2f3b4c',
    padding: 14,
    borderRadius: 12,
  },
  smallBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: (360 - 28 - 28) / 3,
    height: (360 - 28 - 28) / 3,
    gap: 6,
    backgroundColor: '#e5e7eb',
    padding: 10,
    borderRadius: 12,
  },
  smallBoardActive: {
    borderWidth: 3,
    borderColor: '#60a5fa',
    padding: 7,
  },
  smallBoardWon: {
    backgroundColor: '#d1d5db',
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
});
