import crypto from 'node:crypto';

type CodigoRecuperacao = {
  codigo: string;
  expiraEm: number;
  tentativas: number;
};

const codigos = new Map<string, CodigoRecuperacao>();
const DURACAO_CODIGO_MS = 10 * 60 * 1000;
const MAX_TENTATIVAS = 5;

function gerarCodigo() {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

function normalizarTelefone(telefone: string) {
  const numeros = telefone.replace(/\D/g, '');
  return numeros.startsWith('55') ? numeros : `55${numeros}`;
}

export async function enviarCodigoWhatsApp(telefone: string) {
  const telefoneNormalizado = normalizarTelefone(telefone);
  const codigo = gerarCodigo();
  codigos.set(telefoneNormalizado, { codigo, expiraEm: Date.now() + DURACAO_CODIGO_MS, tentativas: 0 });

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const template = process.env.WHATSAPP_TEMPLATE_NAME;

  if (!token || !phoneNumberId || !template) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('O envio por WhatsApp não está configurado no servidor.');
    }
    console.log(`[WHATSAPP DEV] Código para ${telefoneNormalizado}: ${codigo}`);
    return { modo: 'desenvolvimento' as const, codigoDev: codigo };
  }

  const resposta = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: telefoneNormalizado,
      type: 'template',
      template: {
        name: template,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'pt_BR' },
        components: [{ type: 'body', parameters: [{ type: 'text', text: codigo }] }],
      },
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    throw new Error(`Não foi possível enviar o código por WhatsApp: ${detalhe}`);
  }
  return { modo: 'whatsapp' as const };
}

export function validarCodigoWhatsApp(telefone: string, codigoInformado: string) {
  const telefoneNormalizado = normalizarTelefone(telefone);
  const registro = codigos.get(telefoneNormalizado);
  if (!registro || registro.expiraEm < Date.now()) {
    codigos.delete(telefoneNormalizado);
    return { valido: false, erro: 'O código expirou. Solicite um novo código.' };
  }
  if (registro.tentativas >= MAX_TENTATIVAS) {
    codigos.delete(telefoneNormalizado);
    return { valido: false, erro: 'Número máximo de tentativas atingido. Solicite um novo código.' };
  }
  registro.tentativas += 1;
  if (codigoInformado.length !== 6 || !crypto.timingSafeEqual(Buffer.from(registro.codigo), Buffer.from(codigoInformado))) {
    return { valido: false, erro: 'Código inválido.' };
  }
  codigos.delete(telefoneNormalizado);
  return { valido: true };
}
