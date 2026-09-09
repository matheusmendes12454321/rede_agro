import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/contexts/auth-context';

type Pedido = { id: string; loja: string; endereco: string; distancia: string; valor: string; itens: string; cor: string };
const PEDIDOS_INICIAIS: Pedido[] = [
  { id: '1', loja: 'Mercado Bom Preço', endereco: 'Av. Central, 120', distancia: '1,2 km', valor: 'R$ 12,50', itens: '2 itens • Mercado', cor: '#E9F6EA' },
  { id: '2', loja: 'Farmácia Vida', endereco: 'Rua do Comércio, 42', distancia: '2,4 km', valor: 'R$ 9,00', itens: '1 item • Farmácia', cor: '#E8F0FD' },
  { id: '3', loja: 'Restaurante da Praça', endereco: 'Praça Brasil, 15', distancia: '3,1 km', valor: 'R$ 15,75', itens: '3 itens • Alimentação', cor: '#FFF0E7' },
];

export default function PedidosTeste() {
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIAIS);
  const [aceitandoId, setAceitandoId] = useState<string | null>(null);
  const { usuario } = useAuth();
  const router = useRouter();

  const aceitar = async (pedido: Pedido) => {
    if (!usuario?.id) { Alert.alert('Entre na conta', 'Faça login para aceitar pedidos.'); return; }
    try {
      setAceitandoId(pedido.id);
      await api.post('/entregas/teste', { entregadorId: usuario.id, indice: Number(pedido.id) - 1 });
      setPedidos((lista) => lista.filter((item) => item.id !== pedido.id));
      Alert.alert('Pedido aceito!', `Siga até ${pedido.loja} para retirar o pedido.`, [{ text: 'Ver rota', onPress: () => router.replace('/(tabs)/home') }]);
    } catch (err: any) {
      Alert.alert('Não foi possível aceitar', err.response?.data?.error || 'Tente novamente.');
    } finally { setAceitandoId(null); }
  };

  return <SafeAreaView style={styles.safeArea}><View style={styles.header}><Text style={styles.title}>Pedidos de teste</Text><Text style={styles.subtitle}>Simule o recebimento de entregas</Text></View>
    <FlatList data={pedidos} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><MaterialCommunityIcons name="check-circle-outline" size={62} color="#23A24D" /><Text style={styles.emptyText}>Todos os pedidos foram atendidos.</Text><TouchableOpacity style={styles.reset} onPress={() => setPedidos(PEDIDOS_INICIAIS)}><Text style={styles.resetText}>CARREGAR NOVAMENTE</Text></TouchableOpacity></View>} renderItem={({ item }) => <View style={styles.card}>
      <View style={[styles.storeIcon, { backgroundColor: item.cor }]}><MaterialCommunityIcons name="storefront-outline" size={29} color="#1E4720" /></View><View style={styles.cardMain}><Text style={styles.store}>{item.loja}</Text><Text style={styles.items}>{item.itens}</Text><Text style={styles.address}>{item.endereco}</Text></View><Text style={styles.value}>{item.valor}</Text>
      <View style={styles.divider} /><View style={styles.cardFooter}><View style={styles.distance}><MaterialCommunityIcons name="map-marker-distance" size={19} color="#1E4720" /><Text style={styles.distanceText}>{item.distancia}</Text></View><TouchableOpacity style={styles.reject} onPress={() => setPedidos((lista) => lista.filter((pedido) => pedido.id !== item.id))}><Text style={styles.rejectText}>RECUSAR</Text></TouchableOpacity><TouchableOpacity disabled={aceitandoId === item.id} style={[styles.accept, aceitandoId === item.id && styles.disabled]} onPress={() => aceitar(item)}><Text style={styles.acceptText}>{aceitandoId === item.id ? 'ACEITANDO...' : 'ACEITAR'}</Text></TouchableOpacity></View>
    </View>} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F5F5' }, header: { backgroundColor: '#1E4720', padding: 20 }, title: { color: '#fff', fontSize: 23, fontWeight: 'bold' }, subtitle: { color: '#CDE6CD', marginTop: 4 }, list: { padding: 16, flexGrow: 1 }, card: { backgroundColor: '#fff', borderRadius: 13, padding: 15, marginBottom: 14, flexDirection: 'row', flexWrap: 'wrap', elevation: 1 }, storeIcon: { width: 51, height: 51, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }, cardMain: { marginLeft: 12, flex: 1 }, store: { color: '#1E4720', fontWeight: 'bold', fontSize: 17 }, items: { color: '#666', fontSize: 12, marginTop: 3 }, address: { color: '#444', fontSize: 13, marginTop: 7 }, value: { color: '#23A24D', fontSize: 17, fontWeight: 'bold' }, divider: { height: 1, backgroundColor: '#E5E5E5', width: '100%', marginVertical: 14 }, cardFooter: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 }, distance: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }, distanceText: { color: '#444', fontWeight: '600' }, reject: { paddingVertical: 10, paddingHorizontal: 10 }, rejectText: { color: '#C0392B', fontWeight: 'bold', fontSize: 12 }, accept: { backgroundColor: '#23A24D', paddingVertical: 10, paddingHorizontal: 13, borderRadius: 7 }, acceptText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }, disabled: { opacity: 0.6 }, empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 }, emptyText: { fontSize: 16, color: '#555', marginTop: 12 }, reset: { marginTop: 22, padding: 13, borderRadius: 8, borderColor: '#23A24D', borderWidth: 1 }, resetText: { color: '#23A24D', fontWeight: 'bold' } });
