import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/services/api';

export default function AvaliarCliente() {
  const [nota, setNota] = useState(0); const [salvando, setSalvando] = useState(false); const router = useRouter(); const { entregaId } = useLocalSearchParams<{ entregaId?: string }>();
  const enviar = async () => { if (!entregaId || !nota) return; try { setSalvando(true); await api.post(`/entregas/${entregaId}/avaliacao`, { nota }); Alert.alert('Obrigado!', 'Sua avaliação foi salva.'); router.replace('/(tabs)/home'); } catch (erro: any) { Alert.alert('Não foi possível enviar', erro.response?.data?.error || 'Tente novamente.'); } finally { setSalvando(false); } };
  return <SafeAreaView style={styles.safeArea}><View style={styles.content}><MaterialCommunityIcons name="account-heart-outline" size={70} color="#1E4720" /><Text style={styles.title}>Como foi a entrega?</Text><Text style={styles.sub}>Sua avaliação nos ajuda a melhorar a plataforma.</Text><View style={styles.stars}>{[1, 2, 3, 4, 5].map((estrela) => <TouchableOpacity key={estrela} onPress={() => setNota(estrela)}><MaterialCommunityIcons name={estrela <= nota ? 'star' : 'star-outline'} size={45} color="#FFC107" /></TouchableOpacity>)}</View><TouchableOpacity disabled={!nota || !entregaId || salvando} style={[styles.button, (!nota || !entregaId || salvando) && styles.disabled]} onPress={() => void enviar()}><Text style={styles.buttonText}>{salvando ? 'ENVIANDO…' : 'ENVIAR AVALIAÇÃO'}</Text></TouchableOpacity><TouchableOpacity onPress={() => router.replace('/(tabs)/home')}><Text style={styles.skip}>Pular por enquanto</Text></TouchableOpacity></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F5F5' }, content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }, title: { color: '#1E4720', fontSize: 25, fontWeight: 'bold', marginTop: 18 }, sub: { color: '#666', textAlign: 'center', marginTop: 8 }, stars: { flexDirection: 'row', marginVertical: 32 }, button: { backgroundColor: '#23A24D', width: '100%', padding: 16, borderRadius: 10, alignItems: 'center' }, disabled: { opacity: 0.45 }, buttonText: { color: '#fff', fontWeight: 'bold' }, skip: { color: '#1E4720', fontWeight: 'bold', marginTop: 22 } });
