import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { Input } from '../../components/Input';
import { Logo } from '../../components/Logo';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembreMe, setLembreMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos!');
      return;
    }

    try {
      setLoading(true);

      // Enviamos 'login' com o valor do e-mail/CPF para bater com a rota do backend
      // Usamos '/login' pois a baseURL do Axios já deve ter o '/api'
      const response = await api.post('/login', { 
        login: email, 
        senha, 
        lembreMe 
      });

      if (response.data.usuario.tipo === 'ADMIN') {
        router.replace({
          pathname: './admin',
          params: { adminId: response.data.usuario.id }
        });
        return;
      }

      Alert.alert('Sucesso', 'Login realizado!');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('[ERRO NO LOGIN]:', err.response?.data || err.message);
      const mensagem = err.response?.data?.error || err.response?.data?.message || 'Falha ao realizar login';
      if (mensagem.includes('PENDENTE')) {
        router.replace('./aguardando-aprovacao');
        return;
      }
      Alert.alert(
        'Erro', 
        mensagem
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground 
        source={require('../../assets/images/fundo.png')} 
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.topArea}>
          <Logo size={180} />
          <View style={styles.container_button}>
            <Pressable style={styles.btnheader}>
              <Text style={styles.textButtonHeader}>ENTRAR</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(cadastro)/etapa1')} style={styles.btnheader2}>
              <Text style={styles.btnTextHeader}>CADASTRAR</Text>
            </Pressable>
          </View> 
        </View>
      </ImageBackground>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardArea}>
            <Input
              label="E-mail ou CPF"
              labelStyle={styles.customLabel}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder=""
            />

            <Input
              label="Senha"
              labelStyle={styles.customLabel}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              placeholder=""
            />

            <TouchableOpacity 
              style={styles.rememberContainer} 
              activeOpacity={0.8}
              onPress={() => setLembreMe(!lembreMe)}
            >
              <View style={[styles.checkbox, lembreMe && styles.checkboxSelected]} />
              <Text style={styles.rememberText}>lembre-me</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnPrimary, loading && styles.btnDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.btnText}>
                {loading ? 'Carregando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('./esqueci-senha')}>
              <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity onPress={() => router.push('/(cadastro)/etapa1')}>
              <Text style={styles.link}>
                Não tem uma conta?{'\n'}
                <Text style={styles.linkBold}>Cadastrar-se</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerBackground: {
    width: '100%',
    paddingTop: 10,
    paddingBottom: 20,
  },
  topArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container_button: {
    backgroundColor: '#3E593E',
    padding: 4,
    width: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    marginTop: 10,
  },
  btnheader: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '49%',
  },
  btnheader2: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '49%',
  },
  textButtonHeader: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 15,
  },
  btnTextHeader: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  cardArea: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: '8%',
    paddingTop: 24,
    paddingBottom: 40,
    width: '100%',
    flex: 1,
    borderRadius:20,
  },
  customLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#a3b19b',
    backgroundColor: '#d8e2d5',
    marginRight: 10,
    borderRadius: 2,
  },
  checkboxSelected: {
    backgroundColor: '#23A24D',
    borderColor: '#23A24D',
  },
  rememberText: {
    fontSize: 16,
    color: '#333333',
  },
  btnPrimary: {
    backgroundColor: '#23A24D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  forgotPassword: {
    color: '#1E4720',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 18,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#cccccc',
    marginVertical: 24,
    width: '80%',
    alignSelf: 'center',
  },
  link: {
    textAlign: 'center',
    color: '#333333',
    fontSize: 16,
    lineHeight: 22,
  },
  linkBold: {
    color: '#e65100',
    fontWeight: 'bold',
    fontSize: 17,
  },
});
