import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';
import { useSettingsStore } from '../store/settingsStore';

export const ScoreDisplay: React.FC = () => {
  const { score, showScore } = useSettingsStore();

  if (!showScore) return null;

  return (
    <View style={styles.container}>
      <View style={styles.scoreBox}>
        <Text style={[styles.label, { color: COLORS.playerX }]}>Player X</Text>
        <Text style={styles.value}>{score.playerX}</Text>
      </View>
      <View style={styles.scoreBox}>
        <Text style={styles.label}>Draws</Text>
        <Text style={styles.value}>{score.draws}</Text>
      </View>
      <View style={styles.scoreBox}>
        <Text style={[styles.label, { color: COLORS.playerO }]}>Player O</Text>
        <Text style={styles.value}>{score.playerO}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreBox: {
    alignItems: 'center',
  },
  label: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: FONTS.sizes.xlarge,
    color: COLORS.text,
    fontWeight: 'bold',
  },
});
