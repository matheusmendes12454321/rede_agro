import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';

export default function SolicitarSaque() {
  const router = useRouter(); const [valor, setValor] = useState(''); const [enviando, setEnviando] = useState(false);
  const solicitar = async () => { try { setEnviando(true); const resposta = await api.post('/carteira/solicitar-saque', { valor: Number(valor.replace(',', '.')) }); Alert.alert('Saque solicitado', `Saldo restante: R$ ${resposta.data.saldo.replace('.', ',')}`, [{ text: 'OK', onPress: () => router.back() }]); } catch (erro: any) { Alert.alert('Não foi possível solicitar', erro.response?.data?.error || 'Verifique sua conexão e tente novamente.'); } finally { setEnviando(false); } };
  return <SafeAreaView style={s.page}><View style={s.card}><Text style={s.title}>Solicitar saque</Text><Text style={s.text}>Informe o valor que deseja transferir para sua chave Pix cadastrada.</Text><TextInput style={s.input} value={valor} onChangeText={setValor} keyboardType="decimal-pad" placeholder="R$ 0,00" /><TouchableOpacity disabled={enviando} style={[s.button, enviando && s.disabled]} onPress={solicitar}><Text style={s.buttonText}>{enviando ? 'ENVIANDO...' : 'SOLICITAR SAQUE'}</Text></TouchableOpacity></View></SafeAreaView>;
}
const s = StyleSheet.create({ page: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#F5F5F5' }, card: { backgroundColor: '#fff', padding: 22, borderRadius: 14 }, title: { fontSize: 24, color: '#1E4720', fontWeight: 'bold' }, text: { marginTop: 10, color: '#555' }, input: { borderWidth: 1, borderColor: '#AABAAA', borderRadius: 8, height: 50, padding: 12, fontSize: 18, marginTop: 22 }, button: { marginTop: 16, backgroundColor: '#23A24D', padding: 15, borderRadius: 9, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: 'bold' }, disabled: { opacity: .6 } });
