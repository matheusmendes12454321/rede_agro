import { Linking } from 'react-native';

export async function abrirWhatsApp(telefone: string, mensagem: string) {
  const numero = telefone.replace(/\D/g, '');
  const url = `https://wa.me/${numero.startsWith('55') ? numero : `55${numero}`}?text=${encodeURIComponent(mensagem)}`;
  const suportado = await Linking.canOpenURL(url);
  if (!suportado) throw new Error('Não foi possível abrir o WhatsApp neste dispositivo.');
  await Linking.openURL(url);
}
