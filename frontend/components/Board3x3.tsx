import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Cell } from './Cell';
import { Player, Board3x3 } from '../types/game';
import { COLORS, SIZES } from '../constants/theme';

interface Board3x3Props {
  board: Board3x3;
  onCellPress: (index: number) => void;
  disabled?: boolean;
  winningLine?: number[];
}

export const Board3x3Component: React.FC<Board3x3Props> = ({
  board,
  onCellPress,
  disabled = false,
  winningLine = [],
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.board}>
        {board.map((cell, index) => (
          <Cell
            key={index}
            value={cell}
            onPress={() => onCellPress(index)}
            disabled={disabled}
            size={SIZES.cellSize}
            isWinningCell={winningLine.includes(index)}
          />
        ))}
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
    width: SIZES.cellSize * 3 + SIZES.spacing * 2,
    gap: SIZES.spacing / 2,
    backgroundColor: '#2d3748',
    padding: 8,
    borderRadius: 14,
  },
});
