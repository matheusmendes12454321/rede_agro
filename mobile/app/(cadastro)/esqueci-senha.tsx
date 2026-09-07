import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { Logo } from '../../components/Logo';
import { api } from '../../src/services/api';

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);

  const redefinirSenha = async () => {
    if (!email || !novaSenha || !confirmacao) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmacao) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    try {
      setCarregando(true);
      await api.post('/recuperar-senha', { email, novaSenha });
      Alert.alert('Senha atualizada', 'Agora você já pode entrar com sua nova senha.');
      router.replace('./login');
    } catch (err: any) {
      Alert.alert('Não foi possível atualizar', err.response?.data?.error || 'Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Logo size={130} />
        <Text style={styles.title}>Redefinir senha</Text>
        <Text style={styles.description}>Informe o e-mail cadastrado e escolha uma nova senha.</Text>
        <View style={styles.form}>
          <Input label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Nova senha" value={novaSenha} onChangeText={setNovaSenha} secureTextEntry />
          <Input label="Confirmar nova senha" value={confirmacao} onChangeText={setConfirmacao} secureTextEntry />
          <TouchableOpacity style={[styles.primaryButton, carregando && styles.disabled]} onPress={redefinirSenha} disabled={carregando}>
            <Text style={styles.primaryText}>{carregando ? 'ATUALIZANDO...' : 'ATUALIZAR SENHA'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Voltar para entrar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: '8%' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1E4720', marginTop: 18 },
  description: { textAlign: 'center', color: '#555', fontSize: 16, marginTop: 10, marginBottom: 28 },
  form: { width: '100%' },
  primaryButton: { backgroundColor: '#23A24D', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  primaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  disabled: { opacity: 0.65 },
  link: { color: '#1E4720', textAlign: 'center', fontWeight: '600', marginTop: 22 },
});
