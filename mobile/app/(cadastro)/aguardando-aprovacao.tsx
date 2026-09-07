import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Logo } from '../../components/Logo';

export default function AguardandoAprovacao() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Logo size={140} />
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="clock-outline" size={70} color="#1E4720" />
        </View>
        <Text style={styles.title}>Cadastro em análise</Text>
        <Text style={styles.description}>
          Recebemos seus dados e documentos. Um administrador irá conferir seu cadastro antes de liberar seu acesso.
        </Text>
        <Text style={styles.hint}>Você poderá entrar assim que ele for aprovado.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('./login')}>
          <Text style={styles.buttonText}>VOLTAR PARA ENTRAR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '10%' },
  iconCircle: { marginTop: 30, width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDEBDD' },
  title: { color: '#1E4720', fontSize: 27, fontWeight: 'bold', marginTop: 26, textAlign: 'center' },
  description: { color: '#444', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 14 },
  hint: { color: '#666', fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 14 },
  button: { backgroundColor: '#23A24D', paddingVertical: 15, paddingHorizontal: 22, borderRadius: 10, marginTop: 35 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
