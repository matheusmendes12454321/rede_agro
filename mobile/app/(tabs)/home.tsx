import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { MapaNativo } from '../../components/MapaNativo';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/auth-context';
import { obterRotaPorEstradas } from '../../src/services/route-service';

type Coordenada = { latitude: number; longitude: number };
type Entrega = { id: string; status: string; endereco_coleta: string; endereco_entrega: string; lat_coleta: number; lng_coleta: number; lat_entrega: number; lng_entrega: number; valor: number };
const centroBrasil: Coordenada = { latitude: -15.793889, longitude: -47.882778 };

export default function Home() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [online, setOnline] = useState(true);
  const [posicao, setPosicao] = useState<Coordenada>(centroBrasil);
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [rota, setRota] = useState<Coordenada[]>([]);
  const [carregando, setCarregando] = useState(true);

  const atualizarLocalizacao = useCallback(async () => {
    const permissao = await Location.requestForegroundPermissionsAsync();
    if (permissao.status !== 'granted') {
      Alert.alert('Localização desativada', 'Ative a localização para gerar rotas precisas.');
      return;
    }
    const local = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setPosicao({ latitude: local.coords.latitude, longitude: local.coords.longitude });
  }, []);

  const carregarEntrega = useCallback(async () => {
    if (!usuario?.id) { setCarregando(false); return; }
    try {
      setCarregando(true);
      const resposta = await api.get('/entregas');
      const ativa = resposta.data.entregas?.[0] ?? null;
      setEntrega(ativa);
    } catch (err: any) {
      Alert.alert('Não foi possível atualizar', err.response?.data?.error || 'Tente novamente.');
    } finally { setCarregando(false); }
  }, [usuario?.id]);

  useEffect(() => { void atualizarLocalizacao(); }, [atualizarLocalizacao]);
  useFocusEffect(useCallback(() => { void carregarEntrega(); }, [carregarEntrega]));

  useEffect(() => {
    if (!entrega) { setRota([]); return; }
    const indoParaColeta = entrega.status === 'ACEITO' || entrega.status === 'A_CAMINHO_COLETA';
    const destino = indoParaColeta ? { latitude: entrega.lat_coleta, longitude: entrega.lng_coleta } : { latitude: entrega.lat_entrega, longitude: entrega.lng_entrega };
    if (!Number.isFinite(destino.latitude) || !Number.isFinite(destino.longitude)) {
      setRota([]);
      return;
    }
    obterRotaPorEstradas(posicao, destino).then(setRota).catch(() => setRota([posicao, destino]));
  }, [entrega, posicao]);

  const alterarDisponibilidade = async (novoStatus: boolean) => {
    setOnline(novoStatus);
    if (!usuario?.id) return;
    try {
      const resposta = await api.patch('/entregador/status', { disponivel: novoStatus, latitude: posicao.latitude, longitude: posicao.longitude });
      setOnline(resposta.data.disponivel);
    } catch (err: any) {
      setOnline(!novoStatus);
      Alert.alert('Disponibilidade não atualizada', err.response?.data?.error || 'Verifique a conexão e tente novamente.');
    }
  };

  const abrirDetalhes = () => {
    if (!entrega) return;
    router.push({ pathname: '/(tabs)/entrega-detalhes', params: { entregaId: entrega.id, status: entrega.status, origem: entrega.endereco_coleta, destino: entrega.endereco_entrega, valor: String(entrega.valor), latColeta: String(entrega.lat_coleta), lngColeta: String(entrega.lng_coleta), latEntrega: String(entrega.lat_entrega), lngEntrega: String(entrega.lng_entrega) } });
  };
  return <SafeAreaView style={styles.safeArea} edges={['top']}><View style={styles.mapArea}>
    <MapaNativo posicao={posicao} rota={rota} mostrarDestino={Boolean(entrega)} />
    <View style={styles.availability}><TouchableOpacity onPress={() => router.push('/(tabs)/perfil')} style={styles.userIcon}><MaterialCommunityIcons name="account" size={25} color="#1E4720" /></TouchableOpacity><View style={styles.availabilityText}><Text style={styles.availabilityLabel}>{online ? 'Disponível' : 'Indisponível'}</Text><Text style={styles.availabilitySub}>{online ? 'Procurando novas corridas' : 'Você não receberá pedidos'}</Text></View><Switch value={online} onValueChange={alterarDisponibilidade} trackColor={{ false: '#919191', true: '#71C878' }} thumbColor="#fff" /></View>
    <TouchableOpacity style={styles.location} onPress={atualizarLocalizacao}><MaterialCommunityIcons name="crosshairs-gps" color="#1E4720" size={25} /></TouchableOpacity>
  </View>
    <View style={styles.sheet}><View style={styles.handle} />{carregando ? <ActivityIndicator color="#23A24D" /> : entrega ? <><Text style={styles.sheetTitle}>Entrega em andamento</Text><Text style={styles.address}><MaterialCommunityIcons name="storefront" size={17} color="#1E4720" /> {entrega.endereco_coleta}</Text><Text style={styles.address}><MaterialCommunityIcons name="map-marker" size={17} color="#F05A28" /> {entrega.endereco_entrega}</Text><TouchableOpacity style={styles.primary} onPress={abrirDetalhes}><Text style={styles.primaryText}>VER DETALHES DA ENTREGA</Text></TouchableOpacity></> : <><Text style={styles.sheetTitle}>{online ? 'Procurando novas corridas' : 'Você está offline'}</Text><Text style={styles.sheetText}>{online ? 'Fique atento: novos pedidos aparecerão aqui.' : 'Ative a disponibilidade para receber pedidos.'}</Text><TouchableOpacity disabled={!online} style={[styles.primary, !online && styles.disabled]} onPress={() => router.push('/(tabs)/pedidos-teste')}><MaterialCommunityIcons name="clipboard-list-outline" color="#fff" size={21} /><Text style={styles.primaryText}>VER PEDIDOS DE TESTE</Text></TouchableOpacity></>}<View style={styles.earnings}><View><Text style={styles.earningsLabel}>Ganhos do dia</Text><Text style={styles.earningsValue}>R$ 123,00</Text><Text style={styles.balance}>saldo total: R$ 323,00</Text></View><TouchableOpacity onPress={() => router.push('/(tabs)/extrato')}><Text style={styles.more}>Ver mais</Text></TouchableOpacity></View></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#fff' }, mapArea: { flex: 1, backgroundColor: '#E1E8DF' }, availability: { position: 'absolute', top: 16, left: 18, right: 18, backgroundColor: '#1E4720', borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 5 }, userIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }, availabilityText: { flex: 1 }, availabilityLabel: { color: '#fff', fontWeight: 'bold', fontSize: 16 }, availabilitySub: { color: '#CDE6CD', fontSize: 12, marginTop: 2 }, location: { position: 'absolute', right: 18, bottom: 22, backgroundColor: '#fff', borderRadius: 28, padding: 13, elevation: 4 }, sheet: { backgroundColor: '#21A441', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 }, handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#187A30', marginBottom: 12 }, sheetTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' }, sheetText: { color: '#E0F8E4', marginTop: 5 }, address: { color: '#fff', backgroundColor: '#198735', padding: 9, marginTop: 8, borderRadius: 7, fontSize: 13 }, primary: { marginTop: 14, backgroundColor: '#1E4720', borderRadius: 9, padding: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, primaryText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }, disabled: { opacity: 0.5 }, earnings: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#187F32', padding: 14, borderRadius: 10, marginTop: 15 }, earningsLabel: { color: '#D5F0D8' }, earningsValue: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 2 }, balance: { color: '#D5F0D8', fontSize: 12 }, more: { color: '#fff', fontWeight: 'bold', marginTop: 4 } });
