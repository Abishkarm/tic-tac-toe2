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
  // For 9x9, use calculated size
  const cellStyle: ViewStyle = {
    width: size,
    height: size,
    backgroundColor: isWinningCell ? '#fef3c7' : '#ffffff',
    borderRadius: size === SIZES.cellSize9x9 ? 6 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: isWinningCell ? '#f59e0b' : '#c7d2de',
  };

  const iconSize = size * 0.6;
  const iconColor = '#ef4444'; // Red color from reference

  return (
    <TouchableOpacity
      style={cellStyle}
      onPress={onPress}
      disabled={disabled || value !== null}
      activeOpacity={0.7}
    >
      {value === 'X' && (
        <Animatable.View animation="zoomIn" duration={300}>
          <Ionicons name="close" size={iconSize} color={iconColor} />
        </Animatable.View>
      )}
      {value === 'O' && (
        <Animatable.View animation="zoomIn" duration={300}>
          <Ionicons name="ellipse-outline" size={iconSize} color={iconColor} />
        </Animatable.View>
      )}
    </TouchableOpacity>
  );
};
