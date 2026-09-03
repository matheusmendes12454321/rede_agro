import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Platform, TextInput } from 'react-native';

// Tipos suportados pelo Banco Central
type TipoChave = 'CPF' | 'CNPJ' | 'CELULAR' | 'EMAIL' | 'EVP';

export default function PagamentoScreen({ valorPadrao = 0.00 }: { valorPadrao?: number }) {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [carregando, setCarregando] = useState<boolean>(false);

  // Estados dos dados do Pix
  const [tipoChave, setTipoChave] = useState<TipoChave>('CPF');
  const [chave, setChave] = useState<string>('coloque sua chave');
  const [nome, setNome] = useState<string>('RECEBEDOR OFICIAL');
  const [cidade, setCidade] = useState<string>('SAO PAULO');
  const [valorInput, setValorInput] = useState<string>(valorPadrao.toFixed(2));

  const [pixPayload, setPixPayload] = useState<string>('');
  const [copiado, setCopiado] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      gerarPayloadPixValido();
    }
  }, [isMounted, tipoChave, chave, nome, cidade, valorInput]);

  // Formatador EMV
  const formatarCampoEMV = (tag: string, valor: string): string => {
    const len = valor.length.toString().padStart(2, '0');
    return `${tag}${len}${valor}`;
  };

  // Formatação direta com base no TIPO da chave (exatamente como virá do seu BD)
  const tratarChavePix = (chaveRaw: string, tipo: TipoChave): string => {
    const limpa = chaveRaw.trim();

    switch (tipo) {
      case 'EMAIL':
      case 'EVP':
        // E-mail e Chave Aleatória (EVP) devem ser estritamente em minúsculas
        return limpa.toLowerCase();

      case 'CPF':
      case 'CNPJ':
        // Apenas dígitos
        return limpa.replace(/\D/g, '');

      case 'CELULAR': {
        const apenasNumeros = limpa.replace(/\D/g, '');
        // Se a pessoa digitou com o 55 no começo (ex: 5511999999999)
        if (apenasNumeros.startsWith('55') && (apenasNumeros.length === 12 || apenasNumeros.length === 13)) {
          return `+${apenasNumeros}`;
        }
        // Se digitou com +55
        if (limpa.startsWith('+')) {
          return limpa;
        }
        // Caso padrão (ex: 11999999999) -> Adiciona o +55 obrigatorio do BACEN
        return `+55${apenasNumeros}`;
      }

      default:
        return limpa;
    }
  };

  // Cálculo CRC16-CCITT
  const calcularCRC16 = (payload: string): string => {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if ((crc & 0x8000) !== 0) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  };

  const gerarPayloadPixValido = () => {
    try {
      setCarregando(true);
      
      const chaveTratada = tratarChavePix(chave, tipoChave);

      const nomeLimpo = nome.trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .substring(0, 25) || 'RECEBEDOR';

      const cidadeLimpa = cidade.trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .substring(0, 15) || 'SAO PAULO';
      
      const valorNum = parseFloat(valorInput.replace(',', '.')) || 0;
      const valStr = valorNum.toFixed(2);

      // Bloco 26 (Merchant Account Information)
      const tag00 = formatarCampoEMV('00', 'BR.GOV.BCB.PIX');
      const tag01 = formatarCampoEMV('01', chaveTratada);
      const bloco26 = formatarCampoEMV('26', `${tag00}${tag01}`);

      // Bloco 62 (txid)
      const tag05 = formatarCampoEMV('05', '***');
      const bloco62 = formatarCampoEMV('62', tag05);

      // Montagem do payload completo
      const payloadSemCRC = 
        formatarCampoEMV('00', '01') +
        bloco26 +
        formatarCampoEMV('52', '0000') +
        formatarCampoEMV('53', '986') +
        formatarCampoEMV('54', valStr) +
        formatarCampoEMV('58', 'BR') +
        formatarCampoEMV('59', nomeLimpo) +
        formatarCampoEMV('60', cidadeLimpa) +
        bloco62 +
        '6304';

      const crc = calcularCRC16(payloadSemCRC);
      setPixPayload(`${payloadSemCRC}${crc}`);
    } catch (e) {
      console.error('Erro ao gerar código Pix:', e);
    } finally {
      setCarregando(false);
    }
  };

  const copiarPix = async () => {
    if (!pixPayload) return;

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(pixPayload);
        }
      } else {
        const Clipboard = require('expo-clipboard');
        if (Clipboard.setStringAsync) {
          await Clipboard.setStringAsync(pixPayload);
        }
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (e) {
      Alert.alert('Info', 'Código pronto para cópia.');
    }
  };

  if (!isMounted) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  const qrCodeUrl = `https://quickchart.io/qr?size=250&text=${encodeURIComponent(pixPayload)}`;

  const tiposDisponiveis: TipoChave[] = ['CPF', 'CNPJ', 'CELULAR', 'EMAIL', 'EVP'];

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Pagamento via Pix</Text>

      {/* Seletor do Tipo de Chave */}
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Tipo de Chave:</Text>
        <View style={styles.tiposContainer}>
          {tiposDisponiveis.map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={[styles.tipoButton, tipoChave === tipo && styles.tipoButtonSelected]}
              onPress={() => setTipoChave(tipo)}
            >
              <Text style={[styles.tipoButtonText, tipoChave === tipo && styles.tipoButtonTextSelected]}>
                {tipo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Chave Pix:</Text>
        <TextInput
          style={styles.input}
          value={chave}
          onChangeText={setChave}
          placeholder={`Digite o ${tipoChave}`}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Valor (R$):</Text>
        <TextInput
          style={styles.input}
          value={valorInput}
          onChangeText={setValorInput}
          keyboardType="numeric"
        />
      </View>

      {carregando || !pixPayload ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.qrContainer}>
          <Image source={{ uri: qrCodeUrl }} style={styles.qrImage} />
        </View>
      )}

      <TouchableOpacity style={styles.btnCopiar} onPress={copiarPix}>
        <Text style={styles.btnText}>
          {copiado ? '✓ Copiado com sucesso!' : 'Copiar Pix Copia e Cola'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 16,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tiposContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tipoButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  tipoButtonSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  tipoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  tipoButtonTextSelected: {
    color: '#fff',
  },
  input: {
    width: '100%',
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  qrContainer: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 12,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  btnCopiar: {
    width: '100%',
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});