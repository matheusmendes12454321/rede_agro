import React from 'react';
import { StyleSheet, Text, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';

export default function Apresentacao() {
  const router = useRouter();

  return (
    <ImageBackground 
      source={require('../assets/images/fundo.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topArea}>
          <Logo size={220} />
          <Text style={styles.title}>REDE AGRO</Text>
          <Text style={styles.subtitle}>Para Entregadores</Text>
        </View>

        <View style={styles.bottomArea}>
          <Button 
            title="ENTRAR" 
            variant="outline" 
            onPress={() => router.push('/(cadastro)/login')} 
          />
          
          <Button 
            title="CADASTRAR" 
            variant="solid" 
            onPress={() => router.push('/(cadastro)/etapa1')} 
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    height:700,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topArea: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 12 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    letterSpacing: 1, 
    fontFamily: 'sans-serif' 
  },
  subtitle: { 
    fontSize: 30, 
    color: '#d4edda', 
    fontFamily: 'jonhuria' 
  },
  bottomArea: { 
    backgroundColor: '#fff', 
    paddingHorizontal: '12%', 
    paddingVertical: 70,     
    gap: 14,
    width: '100%',
  },
});