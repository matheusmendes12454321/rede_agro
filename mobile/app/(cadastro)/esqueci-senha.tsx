import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '../../components/Input';
import { Logo } from '../../components/Logo';
import { api } from '../../src/services/api';

export default function EsqueciSenha() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<'telefone' | 'senha'>('telefone');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);

  const enviarCodigo = async () => {
    try {
      setCarregando(true);
      const resposta = await api.post('/recuperar-senha/enviar-codigo', { telefone });
      if (resposta.data.codigoDev) {
        Alert.alert('Modo de desenvolvimento', `Código de teste: ${resposta.data.codigoDev}`);
      } else {
        Alert.alert('Código enviado', 'Confira o WhatsApp do telefone cadastrado.');
      }
      setEtapa('senha');
    } catch (err: any) {
      Alert.alert('Não foi possível enviar', err.response?.data?.error || 'Tente novamente.');
    } finally { setCarregando(false); }
  };

  const redefinirSenha = async () => {
    if (novaSenha.length < 6 || novaSenha !== confirmacao) {
      Alert.alert('Atenção', novaSenha.length < 6 ? 'A senha precisa ter ao menos 6 caracteres.' : 'As senhas não coincidem.');
      return;
    }
    try {
      setCarregando(true);
      await api.post('/recuperar-senha/confirmar', { telefone, codigo, novaSenha });
      Alert.alert('Senha atualizada', 'Agora você já pode entrar com sua nova senha.');
      router.replace('./login');
    } catch (err: any) {
      Alert.alert('Não foi possível atualizar', err.response?.data?.error || 'Tente novamente.');
    } finally { setCarregando(false); }
  };

  return <SafeAreaView style={styles.safeArea}><KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Logo size={130} />
    <Text style={styles.title}>{etapa === 'telefone' ? 'Recuperar senha' : 'Criar nova senha'}</Text>
    <Text style={styles.description}>{etapa === 'telefone' ? 'Vamos enviar um código de confirmação para seu WhatsApp cadastrado.' : `Digite o código enviado para ${telefone}.`}</Text>
    <View style={styles.form}>
      {etapa === 'telefone' ? <Input label="WhatsApp com DDD" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" placeholder="(00) 00000-0000" /> : <>
        <Text style={styles.label}>Código de 6 dígitos</Text><TextInput style={styles.codigo} value={codigo} onChangeText={setCodigo} keyboardType="numeric" maxLength={6} textAlign="center" />
        <Input label="Nova senha" value={novaSenha} onChangeText={setNovaSenha} secureTextEntry />
        <Input label="Confirmar nova senha" value={confirmacao} onChangeText={setConfirmacao} secureTextEntry />
      </>}
      <TouchableOpacity style={[styles.button, carregando && styles.disabled]} onPress={etapa === 'telefone' ? enviarCodigo : redefinirSenha} disabled={carregando}><Text style={styles.buttonText}>{carregando ? 'AGUARDE...' : etapa === 'telefone' ? 'ENVIAR CÓDIGO' : 'ATUALIZAR SENHA'}</Text></TouchableOpacity>
      {etapa === 'senha' && <TouchableOpacity disabled={carregando} onPress={enviarCodigo}><Text style={styles.link}>Reenviar código</Text></TouchableOpacity>}
      <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Voltar para entrar</Text></TouchableOpacity>
    </View>
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' }, content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: '8%' }, title: { fontSize: 26, fontWeight: 'bold', color: '#1E4720', marginTop: 18 }, description: { textAlign: 'center', color: '#555', fontSize: 16, marginTop: 10, marginBottom: 28, lineHeight: 22 }, form: { width: '100%' }, label: { color: '#333', fontSize: 14, fontWeight: 'bold', marginBottom: 6 }, codigo: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#23A24D', borderRadius: 8, height: 50, fontSize: 23, letterSpacing: 9, marginBottom: 16 }, button: { backgroundColor: '#23A24D', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 6 }, buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }, disabled: { opacity: 0.65 }, link: { color: '#1E4720', textAlign: 'center', fontWeight: '600', marginTop: 20 },
});
