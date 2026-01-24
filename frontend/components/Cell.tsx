import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Player } from '../types/game';
import { COLORS, SIZES } from '../constants/theme';
import * as Animatable from 'react-native-animatable';

interface CellProps {
  value: Player;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
  isWinningCell?: boolean;
}

export const Cell: React.FC<CellProps> = ({
  value,
  onPress,
  disabled = false,
  size = SIZES.cellSize,
  isWinningCell = false,
}) => {
  const cellStyle: ViewStyle = {
    width: size,
    height: size,
    backgroundColor: isWinningCell ? COLORS.winnerGlow : COLORS.cellDefault,
    borderWidth: SIZES.borderWidth,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  };

  const iconSize = size * 0.6;

  return (
    <TouchableOpacity
      style={cellStyle}
      onPress={onPress}
      disabled={disabled || value !== null}
      activeOpacity={0.7}
    >
      {value === 'X' && (
        <Animatable.View animation="zoomIn" duration={300}>
          <Ionicons name="close" size={iconSize} color={COLORS.playerX} />
        </Animatable.View>
      )}
      {value === 'O' && (
        <Animatable.View animation="zoomIn" duration={300}>
          <Ionicons name="ellipse-outline" size={iconSize} color={COLORS.playerO} />
        </Animatable.View>
      )}
    </TouchableOpacity>
  );
};
