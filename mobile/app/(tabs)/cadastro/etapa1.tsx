import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Pressable,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Input } from '../../../components/Input';
import { Logo } from '../../../components/Logo';

export default function CadastroEtapa1() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '', 
    cpf: '', 
    telefone: '', 
    endereco: '', 
    email: '', 
    senha: '', 
    confirmarSenha: ''
  });

  const handleProximo = () => {
    if (!form.nome || !form.cpf || !form.email || !form.senha) {
      Alert.alert('Atenção', 'Preencha os campos obrigatórios!');
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem!');
      return;
    }

    router.push({
      pathname: '/cadastro/etapa2',
      params: { dadosPessoais: JSON.stringify(form) }
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground 
        source={require('../../../assets/images/fundo.png')} 
        style={styles.headerBackground}
        resizeMode="cover"
      >
        <View style={styles.topArea}>
          <Logo size={180} />
          <View style={styles.container_button}>
            <Pressable onPress={() => router.push('/login')} style={styles.btnheader2}>
              <Text style={styles.btnTextHeader}>ENTRAR</Text>
            </Pressable>
            <Pressable style={styles.btnheader}>
              <Text style={styles.textButtonHeader}>CADASTRAR</Text>
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
            {/* Componente das Bolinhas de Etapa (Stepper) */}
            <View style={styles.stepIndicatorContainer}>
              <View style={[styles.stepCircle, styles.stepActive]}>
                <Text style={styles.stepTextActive}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepCircle, styles.stepInactive]}>
                <Text style={styles.stepTextInactive}>2</Text>
              </View>
            </View>

            <Input
              label="Nome Completo"
              labelStyle={styles.customLabel}
              value={form.nome}
              onChangeText={(v) => setForm({ ...form, nome: v })}
              placeholder=""
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="CPF"
                  labelStyle={styles.customLabel}
                  value={form.cpf}
                  keyboardType="numeric"
                  onChangeText={(v) => setForm({ ...form, cpf: v })}
                  placeholder=""
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Telefone"
                  labelStyle={styles.customLabel}
                  value={form.telefone}
                  keyboardType="phone-pad"
                  onChangeText={(v) => setForm({ ...form, telefone: v })}
                  placeholder=""
                />
              </View>
            </View>

            <Input
              label="Endereço"
              labelStyle={styles.customLabel}
              value={form.endereco}
              onChangeText={(v) => setForm({ ...form, endereco: v })}
              placeholder=""
            />

            <Input
              label="E-mail"
              labelStyle={styles.customLabel}
              value={form.email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(v) => setForm({ ...form, email: v })}
              placeholder=""
            />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Input
                  label="Senha"
                  labelStyle={styles.customLabel}
                  value={form.senha}
                  secureTextEntry
                  onChangeText={(v) => setForm({ ...form, senha: v })}
                  placeholder=""
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Confirmar Senha"
                  labelStyle={styles.customLabel}
                  value={form.confirmarSenha}
                  secureTextEntry
                  onChangeText={(v) => setForm({ ...form, confirmarSenha: v })}
                  placeholder=""
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleProximo}>
              <Text style={styles.btnText}>Próximo</Text>
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
   cardArea: { backgroundColor: '#f5f5f5', paddingHorizontal: '6%', paddingTop: 24, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', flex: 1 },


  /* Estilos das Bolinhas de Etapa (Stepper) */
    stepIndicatorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: 'center' },

  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepActive: {
    backgroundColor: '#1E4720',
  },
  stepInactive: {
    backgroundColor: '#D9D9D9',
  },
  stepTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepTextInactive: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 8,
  },

  customLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  btnPrimary: {
    backgroundColor: '#23A24D',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});