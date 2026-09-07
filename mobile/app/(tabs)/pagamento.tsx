import React, { useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

type TipoChave = 'CPF' | 'CNPJ' | 'CELULAR' | 'EMAIL' | 'EVP';

function formatarCampo(tag: string, valor: string) {
  return `${tag}${valor.length.toString().padStart(2, '0')}${valor}`;
}

function calcularCrc16(payload: string) {
  let crc = 0xffff;
  for (let indice = 0; indice < payload.length; indice += 1) {
    crc ^= payload.charCodeAt(indice) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function normalizarChave(chave: string, tipo: TipoChave) {
  const valor = chave.trim();
  if (tipo === 'EMAIL' || tipo === 'EVP') return valor.toLowerCase();
  if (tipo === 'CPF' || tipo === 'CNPJ') return valor.replace(/\D/g, '');
  if (valor.startsWith('+')) return valor;
  const numeros = valor.replace(/\D/g, '');
  return numeros.startsWith('55') ? `+${numeros}` : `+55${numeros}`;
}

function gerarPayload(tipo: TipoChave, chave: string, nome: string, cidade: string, valor: string) {
  const chavePix = normalizarChave(chave, tipo);
  const nomeLimpo = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().slice(0, 25) || 'RECEBEDOR';
  const cidadeLimpa = cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().slice(0, 15) || 'SAO PAULO';
  const valorNumerico = Number(valor.replace(',', '.'));
  if (!chavePix || !Number.isFinite(valorNumerico) || valorNumerico <= 0) return '';

  const contaPix = formatarCampo('26', `${formatarCampo('00', 'BR.GOV.BCB.PIX')}${formatarCampo('01', chavePix)}`);
  const semCrc = `${formatarCampo('00', '01')}${contaPix}${formatarCampo('52', '0000')}${formatarCampo('53', '986')}${formatarCampo('54', valorNumerico.toFixed(2))}${formatarCampo('58', 'BR')}${formatarCampo('59', nomeLimpo)}${formatarCampo('60', cidadeLimpa)}${formatarCampo('62', formatarCampo('05', '***'))}6304`;
  return `${semCrc}${calcularCrc16(semCrc)}`;
}

export default function PagamentoScreen() {
  const [tipoChave, setTipoChave] = useState<TipoChave>('CPF');
  const [chave, setChave] = useState('');
  const [nome, setNome] = useState('REDE AGRO');
  const [cidade, setCidade] = useState('SAO PAULO');
  const [valor, setValor] = useState('0,00');
  const [copiado, setCopiado] = useState(false);

  const payload = useMemo(() => gerarPayload(tipoChave, chave, nome, cidade, valor), [tipoChave, chave, nome, cidade, valor]);
  const qrCodeUrl = payload ? `https://quickchart.io/qr?size=250&text=${encodeURIComponent(payload)}` : null;

  const copiarPix = async () => {
    if (!payload) {
      Alert.alert('Dados incompletos', 'Informe uma chave Pix e um valor maior que zero.');
      return;
    }
    await Clipboard.setStringAsync(payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Pagamento via Pix</Text>
      <Text style={styles.label}>Tipo de chave</Text>
      <View style={styles.tiposContainer}>
        {(['CPF', 'CNPJ', 'CELULAR', 'EMAIL', 'EVP'] as TipoChave[]).map((tipo) => (
          <TouchableOpacity key={tipo} style={[styles.tipoButton, tipo === tipoChave && styles.tipoAtivo]} onPress={() => setTipoChave(tipo)}>
            <Text style={[styles.tipoTexto, tipo === tipoChave && styles.tipoTextoAtivo]}>{tipo}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Campo label="Chave Pix" value={chave} onChangeText={setChave} placeholder="Digite a chave Pix" />
      <Campo label="Nome do recebedor" value={nome} onChangeText={setNome} placeholder="Nome" />
      <Campo label="Cidade" value={cidade} onChangeText={setCidade} placeholder="Cidade" />
      <Campo label="Valor (R$)" value={valor} onChangeText={setValor} placeholder="0,00" keyboardType="decimal-pad" />
      {qrCodeUrl && <View style={styles.qrContainer}><Image source={{ uri: qrCodeUrl }} style={styles.qrImage} /></View>}
      <TouchableOpacity style={styles.btnCopiar} onPress={copiarPix}>
        <Text style={styles.btnTexto}>{copiado ? '✓ Copiado com sucesso!' : 'Copiar Pix copia e cola'}</Text>
      </TouchableOpacity>
      {Platform.OS === 'web' && payload && <Text selectable style={styles.payload}>{payload}</Text>}
    </ScrollView>
  );
}

function Campo({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.campo}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} {...props} /></View>;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff' }, titulo: { fontSize: 24, fontWeight: 'bold', color: '#1E4720', marginBottom: 22 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 }, campo: { marginTop: 14 }, input: { height: 46, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  tiposContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, tipoButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 7, borderWidth: 1, borderColor: '#ccc' }, tipoAtivo: { backgroundColor: '#1E4720', borderColor: '#1E4720' }, tipoTexto: { color: '#333', fontWeight: '600' }, tipoTextoAtivo: { color: '#fff' },
  qrContainer: { alignItems: 'center', marginVertical: 24 }, qrImage: { width: 230, height: 230 }, btnCopiar: { backgroundColor: '#23A24D', paddingVertical: 14, borderRadius: 9, alignItems: 'center', marginTop: 24 }, btnTexto: { color: '#fff', fontSize: 16, fontWeight: 'bold' }, payload: { marginTop: 18, color: '#555' },
});
