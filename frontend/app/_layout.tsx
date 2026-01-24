import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { soundManager } from '../utils/sounds';

export default function RootLayout() {
  useEffect(() => {
    // Initialize sound manager
    soundManager.loadSounds();
    
    return () => {
      soundManager.cleanup();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="game-3x3" />
        <Stack.Screen name="game-9x9" />
        <Stack.Screen name="online" />
        <Stack.Screen name="bluetooth" />
      </Stack>
    </GestureHandlerRootView>
  );
}
