import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, 
  KeyboardAvoidingView, Platform, ScrollView, Pressable 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../../src/services/api';
import { Input } from '../../../components/Input';
import { Logo } from '../../../components/Logo';

export default function CadastroEtapa2() {
  const router = useRouter();
  const { dadosPessoais } = useLocalSearchParams();
  
  const [tipoVeiculo, setTipoVeiculo] = useState('MOTO');
  const [marcaModelo, setMarcaModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [fotoDocVeiculo, setFotoDocVeiculo] = useState<string | null>(null);
  const [fotoCnh, setFotoCnh] = useState<string | null>(null);

  const selecionarImagem = async (setFoto: (uri: string) => void, tag: string) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'É preciso permitir o acesso à galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uriSelecionada = result.assets[0].uri;
      console.log(`[DEBUG - Imagem Selecionada (${tag})]:`, uriSelecionada);
      setFoto(uriSelecionada);
    }
  };

  const handleFinalizarCadastro = async () => {
    console.log('--- INICIANDO PROCESSO DE CADASTRO ---');

    if (!marcaModelo.trim() || !placa.trim()) {
      Alert.alert('Campos obrigatórios', 'Por favor, preencha a Marca/Modelo e a Placa.');
      return;
    }

    if (!fotoCnh || !fotoDocVeiculo) {
      Alert.alert('Documentos obrigatórios', 'Por favor, selecione as fotos da CNH e do Documento.');
      return;
    }

    try {
      if (!dadosPessoais) {
        console.error('[DEBUG - ERRO]: dadosPessoais está vazio/undefined');
        Alert.alert('Erro', 'Dados pessoais não encontrados. Volte para a Etapa 1.');
        return;
      }

      setCarregando(true);

      let parsedDadosPessoais;
      if (typeof dadosPessoais === 'string') {
        try {
          parsedDadosPessoais = JSON.parse(dadosPessoais);
        } catch (e) {
          parsedDadosPessoais = dadosPessoais;
        }
      } else {
        parsedDadosPessoais = dadosPessoais;
      }

      const formData = new FormData();

      formData.append(
        'dadosPessoais', 
        typeof parsedDadosPessoais === 'object' 
          ? JSON.stringify(parsedDadosPessoais) 
          : parsedDadosPessoais
      );
      
      formData.append(
        'dadosVeiculo', 
        JSON.stringify({ tipo: tipoVeiculo, marcaModelo, placa })
      );

      // Tratamento para Web e Dispositivos Móveis (Android/iOS)
      const prepararArquivo = async (uri: string, prefixo: string) => {
        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          const ext = blob.type.split('/')[1] || 'jpg';
          const fileName = `${prefixo}_${Date.now()}.${ext}`;

          return new File([blob], fileName, { type: blob.type });
        } else {
          const fileExtension = uri.split('.').pop() || 'jpg';
          const fileName = `${prefixo}_${Date.now()}.${fileExtension}`;
          const formattedUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');

          return {
            uri: formattedUri,
            name: fileName,
            type: `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`
          } as any;
        }
      };

      const arquivoCnh = await prepararArquivo(fotoCnh, 'cnh');
      const arquivoDoc = await prepararArquivo(fotoDocVeiculo, 'doc_veiculo');

      console.log('[DEBUG - Objeto Arquivo CNH]:', arquivoCnh);
      console.log('[DEBUG - Objeto Arquivo Documento]:', arquivoDoc);

      formData.append('fotoCnh', arquivoCnh);
      formData.append('fotoDocumento', arquivoDoc);

      console.log('[DEBUG - FormData montado. Disparando requisição...]');

      const response = await api.post('/cadastrar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[DEBUG - Resposta do Servidor]:', response.data);

      Alert.alert('Sucesso!', 'Cadastro e fotos salvos com sucesso.');
      router.replace('/login');

    } catch (err: any) {
      console.error('=== [DEBUG - ERRO NO ENVIO] ===');
      if (err.response) {
        console.error('Status Code:', err.response.status);
        console.error('Dados de Erro do Backend:', err.response.data);
      } else if (err.request) {
        console.error('Sem resposta do servidor (Request enviada):', err.request);
      } else {
        console.error('Mensagem de erro:', err.message);
      }
      Alert.alert('Erro no Cadastro', err.response?.data?.error || 'Não foi possível conectar ao servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerBackground}>
            <View style={styles.topArea}>
              <Logo />
              <View style={styles.container_button}>
                <Pressable style={styles.btnheader2} onPress={() => router.push('/login')}>
                  <Text style={styles.btnTextHeader}>Entrar</Text>
                </Pressable>
                <Pressable style={styles.btnheader}>
                  <Text style={styles.textButtonHeader}>Cadastrar</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.cardArea}>
            <View style={styles.stepIndicatorContainer}>
              <View style={[styles.stepCircle, styles.stepInactive]}>
                <Text style={styles.stepTextInactive}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepCircle, styles.stepActive]}>
                <Text style={styles.stepTextActive}>2</Text>
              </View>
            </View>

            <Text style={styles.customLabel}>TIPO DE VEÍCULO</Text>
            <View style={styles.tipoContainer}>
              <TouchableOpacity 
                style={[styles.btnTipo, tipoVeiculo === 'MOTO' && styles.btnTipoAtivo]} 
                onPress={() => setTipoVeiculo('MOTO')}
              >
                <MaterialCommunityIcons name="motorbike" size={24} color="#000000" />
                <Text style={styles.txtTipo}>MOTO</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btnTipo, tipoVeiculo === 'CARRO' && styles.btnTipoAtivo]} 
                onPress={() => setTipoVeiculo('CARRO')}
              >
                <MaterialCommunityIcons name="car" size={24} color="#000000" />
                <Text style={styles.txtTipo}>CARRO</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btnTipo, tipoVeiculo === 'BICICLETA' && styles.btnTipoAtivo]} 
                onPress={() => setTipoVeiculo('BICICLETA')}
              >
                <MaterialCommunityIcons name="bike" size={24} color="#000000" />
                <Text style={styles.txtTipo}>BIKE</Text>
              </TouchableOpacity>
            </View>

            <Input 
              label="MARCA / MODELO" 
              placeholder="Ex: Honda CG 160 / Fiat Uno" 
              value={marcaModelo}
              onChangeText={setMarcaModelo}
            />

            <Input 
              label="PLACA DO VEÍCULO" 
              placeholder="Ex: ABC-1234 ou ABC1D23" 
              value={placa}
              onChangeText={setPlaca}
              autoCapitalize="characters"
            />

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>DOCUMENTAÇÃO</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={[styles.docButton, fotoDocVeiculo ? styles.docButtonSelecionado : null]} 
              onPress={() => selecionarImagem(setFotoDocVeiculo, 'DOC_VEICULO')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={fotoDocVeiculo ? "checkbox-marked-circle" : "file-document-plus"} 
                size={32} 
                color={fotoDocVeiculo ? "#23A24D" : "#000000"} 
              />
              <View style={styles.docTextContainer}>
                <Text style={styles.docTitle}>DOCUMENTO DO VEÍCULO</Text>
                <Text style={styles.docSubtitle}>
                  {fotoDocVeiculo ? 'FOTO SELECIONADA' : 'TOQUE PARA ENVIAR A FOTO'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.docButton, fotoCnh ? styles.docButtonSelecionado : null]} 
              onPress={() => selecionarImagem(setFotoCnh, 'CNH')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={fotoCnh ? "checkbox-marked-circle" : "file-document-plus"} 
                size={32} 
                color={fotoCnh ? "#23A24D" : "#000000"} 
              />
              <View style={styles.docTextContainer}>
                <Text style={styles.docTitle}>CNH (FRENTE E VERSO)</Text>
                <Text style={styles.docSubtitle}>
                  {fotoCnh ? 'FOTO SELECIONADA' : 'TOQUE PARA ENVIAR A FOTO'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.rowBotões}>
              <TouchableOpacity style={styles.btnVoltar} onPress={() => router.back()}>
                <Text style={styles.btnTextVoltar}>VOLTAR</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btnFinalizar, carregando && { opacity: 0.6 }]} 
                onPress={handleFinalizarCadastro}
                disabled={carregando}
              >
                <Text style={styles.btnText}>
                  {carregando ? 'ENVIANDO...' : 'FINALIZAR'}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1E4720' },
  headerBackground: { width: '100%', paddingTop: 10, paddingBottom: 20, backgroundColor: '#1E4720' },
  topArea: { alignItems: 'center', justifyContent: 'center' },
  container_button: { backgroundColor: '#3E593E', padding: 4, width: '85%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, marginTop: 10 },
  btnheader: { backgroundColor: '#ffffff', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', width: '49%' },
  btnheader2: { backgroundColor: 'transparent', paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', width: '49%' },
  textButtonHeader: { color: '#000000', fontWeight: 'bold', fontSize: 15 },
  btnTextHeader: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  cardArea: { backgroundColor: '#f5f5f5', paddingHorizontal: '6%', paddingTop: 24, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', flex: 1 },
  stepIndicatorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' },
  stepCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: '#1E4720' },
  stepInactive: { backgroundColor: '#D9D9D9' },
  stepTextActive: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  stepTextInactive: { color: '#666666', fontWeight: 'bold', fontSize: 16 },
  stepLine: { width: 40, height: 2, backgroundColor: '#D9D9D9', marginHorizontal: 8 },
  customLabel: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  tipoContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  btnTipo: { flex: 1, paddingVertical: 12, backgroundColor: '#E0E0E0', borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 4 },
  btnTipoAtivo: { backgroundColor: '#C8E6C9', borderWidth: 1.5, borderColor: '#23A24D' },
  txtTipo: { color: '#000000', fontWeight: 'bold', fontSize: 12 },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#CCCCCC' },
  dividerText: { marginHorizontal: 10, fontSize: 13, color: '#666666', fontWeight: 'bold' },
  docButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#CCCCCC', borderRadius: 12, padding: 14, marginBottom: 12 },
  docButtonSelecionado: { borderColor: '#23A24D', backgroundColor: '#E8F5E9' },
  docTextContainer: { marginLeft: 12, flex: 1 },
  docTitle: { fontSize: 13, fontWeight: 'bold', color: '#000000' },
  docSubtitle: { fontSize: 11, color: '#666666', fontWeight: '600', marginTop: 2 },
  rowBotões: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btnVoltar: { flex: 1, borderWidth: 1.5, borderColor: '#23A24D', backgroundColor: '#ffffff', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnTextVoltar: { color: '#23A24D', fontWeight: 'bold', fontSize: 16 },
  btnFinalizar: { flex: 1, backgroundColor: '#23A24D', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});