import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/services/api';

type Entrega = { id: string; status: string; endereco_coleta: string; endereco_entrega: string; valor: number; lat_coleta: number; lng_coleta: number; lat_entrega: number; lng_entrega: number };

const tituloStatus: Record<string, string> = { ACEITO: 'Aguardando saída para coleta', A_CAMINHO_COLETA: 'A caminho da coleta', COLETADO: 'Coletado — siga para a entrega', A_CAMINHO_ENTREGA: 'A caminho da entrega' };

export default function Entregas() {
  const router = useRouter();
  const [itens, setItens] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const carregar = useCallback(async () => {
    try { setLoading(true); const resposta = await api.get('/entregas'); setItens(resposta.data.entregas ?? []); }
    catch (erro: any) { Alert.alert('Não foi possível carregar', erro.response?.data?.error || 'Tente novamente.'); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));
  const abrirEntrega = (item: Entrega) => router.push({ pathname: '/(tabs)/entrega-detalhes', params: { entregaId: item.id, status: item.status, origem: item.endereco_coleta, destino: item.endereco_entrega, valor: String(item.valor), latColeta: String(item.lat_coleta), lngColeta: String(item.lng_coleta), latEntrega: String(item.lat_entrega), lngEntrega: String(item.lng_entrega) } });

  return <SafeAreaView style={s.page} edges={['top']}>
    <View style={s.header}><Text style={s.title}>Minhas entregas</Text><Text style={s.subtitle}>Acompanhe suas rotas em andamento</Text></View>
    {loading ? <ActivityIndicator style={s.loader} color="#23A24D" size="large" /> : <FlatList
      data={itens} keyExtractor={(item) => item.id} contentContainerStyle={s.list} refreshing={loading} onRefresh={() => void carregar()}
      ListEmptyComponent={<View style={s.empty}><MaterialCommunityIcons name="truck-check-outline" size={62} color="#23A24D" /><Text style={s.emptyTitle}>Nenhuma entrega em andamento</Text><Text style={s.emptyText}>Quando você aceitar uma corrida, ela aparecerá aqui.</Text></View>}
      renderItem={({ item }) => <TouchableOpacity style={s.card} activeOpacity={0.8} onPress={() => abrirEntrega(item)}>
        <View style={s.cardTop}><View style={s.statusBadge}><View style={s.statusDot} /><Text style={s.status}>{tituloStatus[item.status] ?? item.status.replaceAll('_', ' ')}</Text></View><Text style={s.value}>R$ {Number(item.valor).toFixed(2).replace('.', ',')}</Text></View>
        <View style={s.route}><View style={s.routeIcon}><MaterialCommunityIcons name="storefront-outline" size={20} color="#1E4720" /></View><View style={s.routeText}><Text style={s.label}>COLETA</Text><Text style={s.address}>{item.endereco_coleta}</Text></View></View>
        <View style={s.line} /><View style={s.route}><View style={[s.routeIcon, s.destinationIcon]}><MaterialCommunityIcons name="map-marker" size={20} color="#F05A28" /></View><View style={s.routeText}><Text style={s.label}>ENTREGA</Text><Text style={s.address}>{item.endereco_entrega}</Text></View></View>
        <View style={s.footer}><Text style={s.footerText}>Ver detalhes e rota</Text><MaterialCommunityIcons name="chevron-right" size={23} color="#23A24D" /></View>
      </TouchableOpacity>}
    />}
  </SafeAreaView>;
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F5F7F5' }, header: { backgroundColor: '#1E4720', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 }, title: { color: '#fff', fontSize: 25, fontWeight: 'bold' }, subtitle: { color: '#CDE6CD', marginTop: 4 }, loader: { flex: 1 }, list: { padding: 16, flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 14, elevation: 2, shadowColor: '#1E4720', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }, statusBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }, statusDot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#23A24D' }, status: { color: '#1E4720', fontWeight: 'bold', fontSize: 13 }, value: { color: '#23A24D', fontSize: 18, fontWeight: 'bold' },
  route: { flexDirection: 'row', alignItems: 'flex-start' }, routeIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E5F3E6', justifyContent: 'center', alignItems: 'center', marginRight: 10 }, destinationIcon: { backgroundColor: '#FFF0E9' }, routeText: { flex: 1 }, label: { color: '#788078', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.6 }, address: { color: '#344235', marginTop: 2, fontSize: 14 }, line: { height: 15, width: 1, backgroundColor: '#B8D9BA', marginLeft: 16, marginVertical: 2 }, footer: { borderTopWidth: 1, borderTopColor: '#EDF0ED', marginTop: 15, paddingTop: 11, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, footerText: { color: '#23A24D', fontWeight: 'bold', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 35, paddingBottom: 110 }, emptyTitle: { color: '#1E4720', fontSize: 18, fontWeight: 'bold', marginTop: 14 }, emptyText: { color: '#667', textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
