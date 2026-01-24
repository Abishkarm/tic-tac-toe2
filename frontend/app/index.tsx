import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore } from '../store/settingsStore';
import { COLORS, FONTS } from '../constants/theme';
import * as Animatable from 'react-native-animatable';

export default function HomeScreen() {
  const router = useRouter();
  const { loadSettings, lastPage } = useSettingsStore();

  useEffect(() => {
    // Load settings on app start
    loadSettings().then(() => {
      // Check if we should redirect to last page
      // Only redirect if it's not the first time opening the app
      // (lastPage will be null on first launch)
    });
  }, []);

  const menuItems = [
    {
      icon: 'grid',
      title: '3x3 Classic',
      subtitle: 'Traditional Tic-Tac-Toe',
      color: COLORS.secondary,
      route: '/game-3x3',
    },
    {
      icon: 'globe',
      title: 'Online Multiplayer',
      subtitle: 'Play with friends online',
      color: COLORS.success,
      route: '/online',
    },
    {
      icon: 'bluetooth',
      title: 'Bluetooth',
      subtitle: 'Connect nearby devices',
      color: COLORS.warning,
      route: '/bluetooth',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="trophy" size={48} color={COLORS.secondary} />
        </View>
        <Text style={styles.title}>Ultimate</Text>
        <Text style={styles.subtitle}>Tic-Tac-Toe</Text>
      </Animatable.View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <Animatable.View
            key={item.route}
            animation="fadeInUp"
            delay={index * 100}
            style={styles.menuItemWrapper}
          >
            <TouchableOpacity
              style={[styles.menuItem, { borderLeftColor: item.color, borderLeftWidth: 4 }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={32} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Choose a game mode to start playing</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: FONTS.sizes.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONTS.sizes.large,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuItemWrapper: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: FONTS.sizes.large,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.sizes.small,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});
