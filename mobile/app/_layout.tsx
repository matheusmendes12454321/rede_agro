import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../src/contexts/auth-context';

function RootNavigator() {
  const router = useRouter();
  const { usuario, carregandoSessao } = useAuth();

  useEffect(() => {
    if (!carregandoSessao && usuario) {
      router.replace('/(tabs)/home');
    }
  }, [carregandoSessao, router, usuario]);

  if (carregandoSessao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1E4720" />
      </View>
    );
  }

  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(cadastro)"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
