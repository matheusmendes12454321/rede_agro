import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../src/services/api';

type Cadastro = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  Veiculo?: { tipo?: string; marca_modelo?: string; placa?: string }[];
  Foto?: { tipo_documento: string; url: string }[];
};

export default function Admin() {
  const router = useRouter();
  const { adminId } = useLocalSearchParams<{ adminId: string }>();
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  const carregarCadastros = useCallback(async () => {
    if (!adminId) return;
    try {
      setCarregando(true);
      const resposta = await api.get('/admin/cadastros-pendentes', { params: { adminId } });
      setCadastros(resposta.data.cadastros);
    } catch (err: any) {
      Alert.alert('Não foi possível carregar', err.response?.data?.error || 'Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, [adminId]);

  useEffect(() => {
    const timer = setTimeout(() => { void carregarCadastros(); }, 0);
    return () => clearTimeout(timer);
  }, [carregarCadastros]);

  const decidir = (cadastro: Cadastro, decisao: 'APROVADO' | 'REPROVADO') => {
    const acao = decisao === 'APROVADO' ? 'aprovar' : 'reprovar';
    Alert.alert(`${acao[0].toUpperCase()}${acao.slice(1)} cadastro`, `Deseja ${acao} ${cadastro.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: acao[0].toUpperCase() + acao.slice(1),
        style: decisao === 'REPROVADO' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            setAtualizandoId(cadastro.id);
            await api.post('/admin/decidir-cadastro', { adminId, usuarioId: cadastro.id, decisao });
            setCadastros((itens) => itens.filter((item) => item.id !== cadastro.id));
          } catch (err: any) {
            Alert.alert('Não foi possível atualizar', err.response?.data?.error || 'Tente novamente.');
          } finally {
            setAtualizandoId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View><Text style={styles.title}>Aprovação de cadastros</Text><Text style={styles.subtitle}>Entregadores aguardando análise</Text></View>
        <TouchableOpacity onPress={() => router.replace('./login')}><MaterialCommunityIcons name="logout" size={26} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList
        data={cadastros}
        keyExtractor={(item) => item.id}
        contentContainerStyle={cadastros.length === 0 ? styles.emptyList : styles.list}
        refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregarCadastros} colors={['#23A24D']} />}
        ListEmptyComponent={carregando ? <ActivityIndicator size="large" color="#23A24D" /> : <View style={styles.empty}><MaterialCommunityIcons name="check-circle-outline" size={58} color="#1E4720" /><Text style={styles.emptyText}>Nenhum cadastro pendente.</Text></View>}
        renderItem={({ item }) => {
          const veiculo = item.Veiculo?.[0];
          const atualizando = atualizandoId === item.id;
          return <View style={styles.card}>
            <Text style={styles.name}>{item.nome}</Text>
            <Text style={styles.info}>{item.email}</Text>
            <Text style={styles.info}>CPF: {item.cpf} {item.telefone ? `• ${item.telefone}` : ''}</Text>
            {veiculo && <Text style={styles.vehicle}>{veiculo.tipo} • {veiculo.marca_modelo} • {veiculo.placa}</Text>}
            {!!item.Foto?.length && <View style={styles.documents}>
              {item.Foto.map((foto) => <TouchableOpacity key={foto.url} onPress={() => Linking.openURL(foto.url)}>
                <Text style={styles.documentLink}>VER {foto.tipo_documento.replaceAll('_', ' ')}</Text>
              </TouchableOpacity>)}
            </View>}
            <View style={styles.actions}>
              <TouchableOpacity disabled={atualizando} onPress={() => decidir(item, 'REPROVADO')} style={[styles.reject, atualizando && styles.disabled]}><Text style={styles.rejectText}>REPROVAR</Text></TouchableOpacity>
              <TouchableOpacity disabled={atualizando} onPress={() => decidir(item, 'APROVADO')} style={[styles.approve, atualizando && styles.disabled]}><Text style={styles.approveText}>{atualizando ? 'SALVANDO...' : 'APROVAR'}</Text></TouchableOpacity>
            </View>
          </View>;
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' }, header: { backgroundColor: '#1E4720', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 22 }, subtitle: { color: '#DDEBDD', marginTop: 4 }, list: { padding: 16 }, emptyList: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, borderLeftWidth: 5, borderLeftColor: '#E8A317', elevation: 1 }, name: { fontSize: 18, fontWeight: 'bold', color: '#1E4720' },
  info: { color: '#555', marginTop: 5 }, vehicle: { color: '#222', fontWeight: '600', marginTop: 10 }, actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  documents: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }, documentLink: { color: '#1E4720', textDecorationLine: 'underline', fontSize: 12, fontWeight: 'bold' },
  approve: { flex: 1, backgroundColor: '#23A24D', borderRadius: 8, alignItems: 'center', paddingVertical: 12 }, reject: { flex: 1, borderWidth: 1, borderColor: '#C0392B', borderRadius: 8, alignItems: 'center', paddingVertical: 12 },
  approveText: { color: '#fff', fontWeight: 'bold' }, rejectText: { color: '#C0392B', fontWeight: 'bold' }, disabled: { opacity: 0.6 }, empty: { alignItems: 'center' }, emptyText: { fontSize: 17, color: '#555', marginTop: 12 },
});
