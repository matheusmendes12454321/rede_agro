import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';

type TipoChave = 'CPF' | 'CNPJ' | 'CELULAR' | 'EMAIL' | 'EVP';

function campo(id: string, valor: string) { return `${id}${valor.length.toString().padStart(2, '0')}${valor}`; }
function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
function normalizarChave(chave: string, tipo: TipoChave) {
  if (tipo === 'EMAIL' || tipo === 'EVP') return chave.trim().toLowerCase();
  if (tipo === 'CPF' || tipo === 'CNPJ') return chave.replace(/\D/g, '');
  const numeros = chave.replace(/\D/g, '');
  return numeros.startsWith('55') ? `+${numeros}` : `+55${numeros}`;
}
function payloadPix(chave: string, tipo: TipoChave, nome: string, cidade: string, valor: number, txid: string) {
  const conta = campo('26', `${campo('00', 'BR.GOV.BCB.PIX')}${campo('01', normalizarChave(chave, tipo))}`);
  const recebedor = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().slice(0, 25) || 'REDE AGRO';
  const local = cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().slice(0, 15) || 'BRASIL';
  const base = `${campo('00', '01')}${conta}${campo('52', '0000')}${campo('53', '986')}${campo('54', valor.toFixed(2))}${campo('58', 'BR')}${campo('59', recebedor)}${campo('60', local)}${campo('62', campo('05', txid))}6304`;
  return `${base}${crc16(base)}`;
}

async function minhaEntrega(id: string, usuarioId: string) {
  const { data, error } = await supabase.from('Entrega').select('*').eq('id', id).eq('entregador_id', usuarioId).maybeSingle();
  if (error) throw error;
  return data;
}
function estadoPagamento(entrega: any) {
  const expirado = entrega.pix_expira_em && new Date(entrega.pix_expira_em).getTime() < Date.now() && entrega.pagamento_status === 'AGUARDANDO_PIX';
  return { ...entrega, pagamento_status: expirado ? 'EXPIRADO' : entrega.pagamento_status };
}

export const obterPagamento: RequestHandler = async (req, res) => {
  try {
    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega) return void res.status(404).json({ error: 'Entrega não encontrada.' });
    const estado = estadoPagamento(entrega);
    if (estado.pagamento_status === 'EXPIRADO') await supabase.from('Entrega').update({ pagamento_status: 'EXPIRADO' }).eq('id', entrega.id);
    res.json({ pagamento: estado });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Não foi possível consultar o pagamento.' }); }
};

export const aprovarCartao: RequestHandler = async (req, res) => {
  try {
    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega) return void res.status(404).json({ error: 'Entrega não encontrada.' });
    if (entrega.metodo_pagamento !== 'CARTAO') return void res.status(400).json({ error: 'Este pedido não é pago por cartão.' });
    if (req.body.aprovado !== true) return void res.status(400).json({ error: 'Confirme a aprovação da maquininha.' });
    const { data, error } = await supabase.from('Entrega').update({ pagamento_status: 'APROVADO' }).eq('id', entrega.id).select().single();
    if (error) throw error;
    res.json({ pagamento: data });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Não foi possível confirmar o cartão.' }); }
};

export const aprovarDinheiro: RequestHandler = async (req, res) => {
  try {
    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega) return void res.status(404).json({ error: 'Entrega não encontrada.' });
    if (entrega.metodo_pagamento !== 'DINHEIRO') return void res.status(400).json({ error: 'Este pedido não é pago em dinheiro.' });
    const recebido = Number(req.body.valorRecebido);
    if (!Number.isFinite(recebido) || recebido < Number(entrega.valor)) return void res.status(400).json({ error: 'O valor recebido é menor que o total do pedido.' });
    if (req.body.confirmado !== true) return void res.status(400).json({ error: 'Confirme o recebimento do dinheiro.' });
    const troco = Number((recebido - Number(entrega.valor)).toFixed(2));
    const { data, error } = await supabase.from('Entrega').update({ pagamento_status: 'APROVADO', valor_recebido: recebido, troco }).eq('id', entrega.id).select().single();
    if (error) throw error;
    res.json({ pagamento: data, troco });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Não foi possível registrar o dinheiro.' }); }
};

export const criarCobrancaPix: RequestHandler = async (req, res) => {
  try {
    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega) return void res.status(404).json({ error: 'Entrega não encontrada.' });
    if (entrega.metodo_pagamento !== 'PIX') return void res.status(400).json({ error: 'Este pedido não é pago por Pix.' });
    const { data: usuario, error: usuarioError } = await supabase.from('Usuario').select('nome, chave_pix, tipo_chave_pix').eq('id', req.auth!.usuarioId).single();
    if (usuarioError) throw usuarioError;
    if (!usuario?.chave_pix || !usuario?.tipo_chave_pix) return void res.status(400).json({ error: 'Cadastre sua chave Pix no perfil antes de gerar a cobrança.' });
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const txid = `RA${Date.now().toString(36).toUpperCase()}`.slice(0, 25);
    const payload = payloadPix(usuario.chave_pix, usuario.tipo_chave_pix as TipoChave, usuario.nome, 'BRASIL', Number(entrega.valor), txid);
    const { data, error } = await supabase.from('Entrega').update({ pagamento_status: 'AGUARDANDO_PIX', pix_payload: payload, pix_txid: txid, pix_expira_em: expiraEm }).eq('id', entrega.id).select().single();
    if (error) throw error;
    res.json({ pagamento: data, payload, expiraEm });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Não foi possível gerar o Pix.' }); }
};

// Em produção, o PSP deve chamar este ponto após validar assinatura e txid. O modo de teste permite demonstrar o app sem um PSP.
export const confirmarPixTeste: RequestHandler = async (req, res) => {
  try {
    if (process.env.PIX_MODO_SIMULACAO !== 'true') return void res.status(403).json({ error: 'A confirmação Pix é feita automaticamente pelo provedor de pagamentos.' });
    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega) return void res.status(404).json({ error: 'Entrega não encontrada.' });
    const estado = estadoPagamento(entrega);
    if (estado.pagamento_status !== 'AGUARDANDO_PIX') return void res.status(400).json({ error: 'Não há Pix pendente para confirmar.' });
    const { data, error } = await supabase.from('Entrega').update({ pagamento_status: 'APROVADO' }).eq('id', entrega.id).select().single();
    if (error) throw error;
    res.json({ pagamento: data });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Não foi possível confirmar o Pix.' }); }
};
