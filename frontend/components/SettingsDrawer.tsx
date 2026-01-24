import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { useSettingsStore } from '../store/settingsStore';
import * as Animatable from 'react-native-animatable';

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ visible, onClose }) => {
  const {
    soundEnabled,
    vibrationEnabled,
    showScore,
    showReplayButton,
    toggleSound,
    toggleVibration,
    toggleShowScore,
    toggleShowReplayButton,
    resetScore,
  } = useSettingsStore();

  const handleResetScore = () => {
    resetScore();
    alert('Score reset successfully!');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animatable.View animation="slideInRight" duration={300} style={styles.drawer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audio & Haptics</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="volume-medium" size={24} color={COLORS.secondary} />
                  <Text style={styles.settingLabel}>Sound Effects</Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={toggleSound}
                  trackColor={{ false: COLORS.border, true: COLORS.secondary }}
                  thumbColor={COLORS.cardBg}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="phone-portrait" size={24} color={COLORS.secondary} />
                  <Text style={styles.settingLabel}>Vibration</Text>
                </View>
                <Switch
                  value={vibrationEnabled}
                  onValueChange={toggleVibration}
                  trackColor={{ false: COLORS.border, true: COLORS.secondary }}
                  thumbColor={COLORS.cardBg}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Display</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Ionicons name="trophy" size={24} color={COLORS.secondary} />
                  <Text style={styles.settingLabel}>Show Score</Text>
                </View>
                <Switch
                  value={showScore}
                  onValueChange={toggleShowScore}
                  trackColor={{ false: COLORS.border, true: COLORS.secondary }}
                  thumbColor={COLORS.cardBg}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Score Management</Text>

              <TouchableOpacity style={styles.resetButton} onPress={handleResetScore}>
                <Ionicons name="refresh" size={24} color={COLORS.accent} />
                <Text style={styles.resetButtonText}>Reset Score</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.aboutText}>Ultimate Tic-Tac-Toe</Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
          </ScrollView>
        </Animatable.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerText: {
    fontSize: FONTS.sizes.xlarge,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.medium,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  resetButtonText: {
    fontSize: FONTS.sizes.medium,
    color: COLORS.accent,
    fontWeight: '600',
  },
  aboutText: {
    fontSize: FONTS.sizes.large,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
});
