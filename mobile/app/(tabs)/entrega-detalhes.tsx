import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { deliveryService } from '../../src/services/delivery-service';
import { abrirWhatsApp } from '../../src/services/communication-service';
import { useAuth } from '../../src/contexts/auth-context';
import { api } from '../../src/services/api';
import { MapaNativo } from '../../components/MapaNativo';
import { useLocalizacao } from '../../src/hooks/useLocalizacao';
import { obterRotaPorEstradas } from '../../src/services/route-service';

const passos = ['Aceito', 'A caminho da coleta', 'Coletado', 'A caminho da entrega', 'Entregue'];
const indiceStatus: Record<string, number> = { ACEITO: 0, A_CAMINHO_COLETA: 1, COLETADO: 2, A_CAMINHO_ENTREGA: 3, ENTREGUE: 4 };
const transicoes: Record<string, 'A_CAMINHO_COLETA' | 'COLETADO' | 'A_CAMINHO_ENTREGA'> = { ACEITO: 'A_CAMINHO_COLETA', A_CAMINHO_COLETA: 'COLETADO', COLETADO: 'A_CAMINHO_ENTREGA' };
const acoes: Record<string, string> = { ACEITO: 'INICIAR ROTA DE COLETA', A_CAMINHO_COLETA: 'CONFIRMAR COLETA', COLETADO: 'INICIAR ROTA DE ENTREGA', A_CAMINHO_ENTREGA: 'CONFIRMAR ENTREGA', ENTREGUE: 'ENTREGA CONCLUÍDA' };

export default function EntregaDetalhes() {
  const router = useRouter();
  const params = useLocalSearchParams<{ entregaId: string; status: string; origem: string; destino: string; valor: string; latColeta: string; lngColeta: string; latEntrega: string; lngEntrega: string }>();
  const { usuario } = useAuth();
  const [status, setStatus] = useState(params.status || 'ACEITO');
  const [dadosEntrega, setDadosEntrega] = useState<any>(null);
  const [validandoEntrega, setValidandoEntrega] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [foto, setFoto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [rota, setRota] = useState<{ latitude: number; longitude: number }[]>([]);
  const [carregandoRota, setCarregandoRota] = useState(false);
  const { coordenadas: posicao } = useLocalizacao();
  const coleta = useMemo(() => ({ latitude: Number(dadosEntrega?.lat_coleta ?? params.latColeta), longitude: Number(dadosEntrega?.lng_coleta ?? params.lngColeta) }), [dadosEntrega?.lat_coleta, dadosEntrega?.lng_coleta, params.latColeta, params.lngColeta]);
  const entrega = useMemo(() => ({ latitude: Number(dadosEntrega?.lat_entrega ?? params.latEntrega), longitude: Number(dadosEntrega?.lng_entrega ?? params.lngEntrega) }), [dadosEntrega?.lat_entrega, dadosEntrega?.lng_entrega, params.latEntrega, params.lngEntrega]);
  const temCoordenadas = [coleta.latitude, coleta.longitude, entrega.latitude, entrega.longitude].every(Number.isFinite);

  const etapa = useMemo(() => indiceStatus[status] ?? 0, [status]);

  useEffect(() => {
    let ativo = true;
    setValidandoEntrega(true);
    setDadosEntrega(null);
    setStatus(params.status || 'ACEITO');
    api.get(`/entregas/${params.entregaId}`)
      .then((resposta) => {
        if (!ativo) return;
        setDadosEntrega(resposta.data.entrega);
        setStatus(resposta.data.entrega.status);
      })
      .catch(() => { if (ativo) setDadosEntrega(null); })
      .finally(() => { if (ativo) setValidandoEntrega(false); });
    return () => { ativo = false; };
  }, [params.entregaId, params.status]);

  const indoParaColeta = status === 'ACEITO' || status === 'A_CAMINHO_COLETA';
  const destinoRota = useMemo(() => indoParaColeta ? coleta : entrega, [indoParaColeta, coleta, entrega]);
  const tituloDestino = indoParaColeta ? 'Local de coleta' : 'Endereço de entrega';

  useEffect(() => {
    if (!posicao || !temCoordenadas) return;
    let ativo = true;
    setCarregandoRota(true);
    obterRotaPorEstradas(posicao, destinoRota)
      .then((novaRota) => { if (ativo) setRota(novaRota); })
      .catch(() => { if (ativo) setRota([posicao, destinoRota]); })
      .finally(() => { if (ativo) setCarregandoRota(false); });
    return () => { ativo = false; };
  }, [posicao, destinoRota, temCoordenadas]);

  const selecionarFoto = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) { 
      Alert.alert('Permissão necessária', 'Permita o uso da câmera para registrar a entrega.'); 
      return; 
    }
    const resultado = await ImagePicker.launchCameraAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 0.7 
    });
    
    if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
      setFoto(resultado.assets[0].uri);
    }
  };

  const falarComCliente = () => {
    const telefone = dadosEntrega?.cliente_telefone;
    if (!telefone) {
      Alert.alert('Telefone indisponível', 'Esta entrega não possui telefone de cliente cadastrado.');
      return;
    }
    abrirWhatsApp(telefone, 'Olá! Sou o entregador da Rede Agro e estou a caminho com seu pedido.')
      .catch((err) => Alert.alert('WhatsApp', err.message));
  };

  const avancar = async () => {
    console.log('--- BOTÃO AVANÇAR CLICADO ---');
    console.log('Status atual:', status);
    console.log('Foto presente no estado?', !!foto);
    console.log('ID da Entrega:', params.entregaId);

    try {
      setCarregando(true);
      
      if (status === 'A_CAMINHO_ENTREGA') {
        if (!foto) {
          console.log('BLOQUEIO: Foto obrigatória faltando.');
          Alert.alert('Foto obrigatória', 'Por favor, tire uma foto do comprovante de entrega para concluir.');
          setCarregando(false);
          return;
        }

        const pagamento = await api.get(`/entregas/${params.entregaId}/pagamento`);
        if (pagamento.data.pagamento?.pagamento_status !== 'APROVADO') {
          router.push(`/(tabs)/pagamento?entregaId=${params.entregaId}`);
          return;
        }

        const arquivo = { uri: foto, name: `comprovante_${Date.now()}.jpg`, type: 'image/jpeg' };
        console.log('Chamando deliveryService.concluir...');
        const resConcluir = await deliveryService.concluir(params.entregaId, codigo, arquivo);
        console.log('Resposta de concluir:', resConcluir);
        setStatus(resConcluir.entrega?.status ?? 'ENTREGUE');

        console.log('Chamando api.post para registrar corrida...');
        const resCarteira = await api.post('/carteira/registrar-corrida', { 
          entregadorId: usuario?.id, 
          entregaId: params.entregaId, 
          valorTotal: Number(params.valor) 
        });
        console.log('Resposta da carteira:', resCarteira.data);

        Alert.alert('Entrega concluída', 'O ganho foi lançado no extrato.', [
          { text: 'Avaliar cliente', onPress: () => router.replace('/(tabs)/avaliar-cliente') }
        ]);
        return;
      }

      const proximoStatus = transicoes[status];
      if (!proximoStatus) {
        Alert.alert('Status inválido', 'Atualize a tela antes de continuar a entrega.');
        return;
      }
      console.log('Atualizando status intermediário...');
      const entregaAtualizada = await deliveryService.atualizarStatus(params.entregaId, proximoStatus);
      setDadosEntrega((anterior: any) => ({ ...anterior, ...entregaAtualizada }));
      setStatus(entregaAtualizada.status);
    } catch (err: any) { 
      console.log('=== CAPTURADO NO CATCH ===');
      console.log('Erro bruto:', err);
      console.log('Response data:', err.response?.data);
      console.log('Message:', err.message);
      
      Alert.alert('Não foi possível atualizar', err.response?.data?.error || err.message || 'Tente novamente.'); 
    } finally { 
      setCarregando(false); 
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={27} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalhes da entrega</Text>
          <View style={{ width: 27 }} />
        </View>

        <View style={styles.progress}>
          {passos.map((passo, indice) => (
            <React.Fragment key={passo}>
              <View style={[styles.step, indice <= etapa && styles.stepActive]}>
                <Text style={[styles.stepNumber, indice <= etapa && styles.stepNumberActive]}>{indice + 1}</Text>
              </View>
              {indice < passos.length - 1 && <View style={[styles.line, indice < etapa && styles.lineActive]} />}
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.current}>{passos[etapa]}</Text>

        {posicao && temCoordenadas && (
          <View style={styles.routeCard}>
            <View style={styles.routeHeader}>
              <MaterialCommunityIcons name="navigation-variant" size={20} color="#1E4720" />
              <View><Text style={styles.routeTitle}>Rota por ruas</Text><Text style={styles.routeSubtitle}>Indo para: {tituloDestino}</Text></View>
              {carregandoRota && <ActivityIndicator color="#23A24D" />}
            </View>
            <View style={styles.map}><MapaNativo posicao={posicao} rota={rota} mostrarDestino tituloDestino={tituloDestino} /></View>
          </View>
        )}

        <Card icon="storefront" title="Coleta" address={dadosEntrega?.endereco_coleta || params.origem || 'Endereço de coleta'} />
        <Card icon="map-marker" title="Entrega" address={dadosEntrega?.endereco_entrega || params.destino || 'Endereço de destino'} destination />

        <View style={styles.payment}>
          <View><Text style={styles.paymentLabel}>Você vai receber</Text><Text style={styles.paymentMethod}>{dadosEntrega?.metodo_pagamento === 'CARTAO' ? 'Cartão na entrega' : dadosEntrega?.metodo_pagamento === 'DINHEIRO' ? 'Dinheiro na entrega' : 'Pix na entrega'}</Text></View>
          <Text style={styles.paymentValue}>R$ {Number(params.valor || 0).toFixed(2).replace('.', ',')}</Text>
        </View>

        <View style={styles.items}>
          <Text style={styles.itemsTitle}>Itens do pedido</Text>
          <Text style={styles.item}>• Pedido separado e pronto para retirada</Text>
          <Text style={styles.item}>• Confirme os itens antes de sair da coleta</Text>
        </View>

        <TouchableOpacity style={styles.whatsapp} onPress={falarComCliente}>
          <MaterialCommunityIcons name="whatsapp" size={23} color="#168B35" />
          <Text style={styles.whatsappText}>FALAR COM CLIENTE</Text>
        </TouchableOpacity>

        {status === 'A_CAMINHO_ENTREGA' && (
          <View style={styles.proof}>
            <Text style={styles.proofTitle}>Confirmação de entrega</Text>
            <Text style={styles.proofText}>Tire a foto, confirme o pagamento e finalize a entrega.</Text>
            <TextInput value={codigo} onChangeText={setCodigo} keyboardType="numeric" maxLength={4} placeholder="Código do cliente" style={styles.code} />
            <TouchableOpacity style={styles.camera} onPress={selecionarFoto}>
              <MaterialCommunityIcons name="camera" size={21} color="#1E4720" />
              <Text style={styles.cameraText}>{foto ? 'FOTO REGISTRADA' : 'TIRAR FOTO'}</Text>
            </TouchableOpacity>
            {foto && <Image source={{ uri: foto }} style={styles.preview} />}
          </View>
        )}

        <TouchableOpacity disabled={carregando || validandoEntrega || status === 'ENTREGUE'} style={[styles.action, (carregando || validandoEntrega || status === 'ENTREGUE') && styles.disabled]} onPress={avancar}>
          <Text style={styles.actionText}>{carregando || validandoEntrega ? 'ATUALIZANDO...' : (acoes[status] ?? 'ATUALIZE A ENTREGA')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ icon, title, address, destination }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; address: string; destination?: boolean }) { 
  return (
    <View style={styles.card}>
      <View style={[styles.icon, destination && styles.destination]}>
        <MaterialCommunityIcons name={icon} size={24} color="#fff" />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardAddress}>{address}</Text>
      </View>
    </View>
  ); 
}

const styles = StyleSheet.create({ 
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' }, 
  content: { paddingBottom: 30 }, 
  header: { backgroundColor: '#1E4720', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, 
  title: { color: '#fff', fontSize: 19, fontWeight: 'bold' }, 
  progress: { flexDirection: 'row', alignItems: 'center', margin: 24, justifyContent: 'center' }, 
  step: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#B7B7B7', alignItems: 'center', justifyContent: 'center' }, 
  stepActive: { borderColor: '#23A24D', backgroundColor: '#23A24D' }, 
  stepNumber: { color: '#777', fontWeight: 'bold' }, 
  stepNumberActive: { color: '#fff' }, 
  line: { width: 40, height: 2, backgroundColor: '#C7C7C7' }, 
  lineActive: { backgroundColor: '#23A24D' }, 
  current: { textAlign: 'center', color: '#1E4720', fontSize: 18, fontWeight: 'bold', marginTop: -13, marginBottom: 18 }, 
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' }, 
  icon: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#1E4720', alignItems: 'center', justifyContent: 'center' }, 
  destination: { backgroundColor: '#F05A28' }, 
  cardText: { flex: 1, marginLeft: 12 }, 
  cardTitle: { color: '#1E4720', fontWeight: 'bold' }, 
  cardAddress: { color: '#555', marginTop: 4 }, 
  payment: { margin: 16, backgroundColor: '#1E4720', padding: 17, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, 
  paymentLabel: { color: '#CBE5CB' }, paymentMethod: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  paymentValue: { color: '#fff', fontSize: 23, fontWeight: 'bold' }, 
  items: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16 }, 
  itemsTitle: { color: '#1E4720', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }, 
  item: { color: '#555', marginTop: 5 }, 
  whatsapp: { margin: 16, marginBottom: 0, borderWidth: 1, borderColor: '#168B35', borderRadius: 9, padding: 13, flexDirection: 'row', justifyContent: 'center', gap: 8 }, 
  whatsappText: { color: '#168B35', fontWeight: 'bold' }, 
  proof: { margin: 16, backgroundColor: '#fff', padding: 16, borderRadius: 12 }, 
  routeCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  routeHeader: { padding: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  routeTitle: { color: '#1E4720', fontWeight: 'bold' },
  routeSubtitle: { color: '#667', fontSize: 12, marginTop: 2 },
  map: { height: 220, backgroundColor: '#E1E8DF' },
  proofTitle: { color: '#1E4720', fontWeight: 'bold', fontSize: 16 }, 
  proofText: { color: '#666', fontSize: 12, marginTop: 5 }, 
  code: { borderWidth: 1, borderColor: '#AABAAA', borderRadius: 8, marginTop: 12, height: 46, paddingHorizontal: 12, fontSize: 18, letterSpacing: 5 }, 
  camera: { marginTop: 10, backgroundColor: '#E4F2E5', borderRadius: 8, padding: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7 }, 
  cameraText: { color: '#1E4720', fontWeight: 'bold' }, 
  preview: { width: '100%', height: 170, marginTop: 10, borderRadius: 8 }, 
  action: { margin: 16, marginBottom: 0, backgroundColor: '#23A24D', padding: 16, borderRadius: 10, alignItems: 'center' }, 
  actionText: { color: '#fff', fontWeight: 'bold' }, 
  disabled: { opacity: 0.6 } 
});
