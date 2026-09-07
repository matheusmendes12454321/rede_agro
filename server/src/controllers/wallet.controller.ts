import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';

export const salvarChavePix: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, chavePix, tipoChave } = req.body;
    if (!usuarioId || !chavePix || !tipoChave) {
      res.status(400).json({ error: 'Campos usuarioId, chavePix e tipoChave são obrigatórios.' });
      return;
    }
    const { error } = await supabase.from('Usuario').update({
      chave_pix: String(chavePix).trim(),
      tipo_chave_pix: String(tipoChave).toUpperCase().trim(),
    }).eq('id', usuarioId);
    if (error) throw error;
    res.status(200).json({ message: 'Chave Pix cadastrada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const obterPixParaPagamento: RequestHandler = async (req, res) => {
  try {
    const { data: usuario, error } = await supabase.from('Usuario')
      .select('id, nome, chave_pix, tipo_chave_pix').eq('id', req.params.usuarioId).single();
    if (error || !usuario?.chave_pix) {
      res.status(400).json({ error: 'Chave Pix não encontrada para este usuário.' });
      return;
    }
    res.status(200).json({ nomeRecebedor: usuario.nome, chavePix: usuario.chave_pix, tipoChavePix: usuario.tipo_chave_pix });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const registrarCorrida: RequestHandler = async (req, res) => {
  try {
    const { entregadorId, entregaId, valorTotal } = req.body;
    const valor = Number(valorTotal);
    if (!entregadorId || !Number.isFinite(valor) || valor <= 0) {
      res.status(400).json({ error: 'Informe entregadorId e um valorTotal válido.' });
      return;
    }
    const taxaPlataforma = Number((valor * 0.15).toFixed(2));
    const { data: transacao, error } = await supabase.from('Transacao').insert([{
      usuario_id: entregadorId, entrega_id: entregaId || null, tipo: 'CREDITO',
      valor: Number((valor - taxaPlataforma).toFixed(2)), taxa_plataforma: taxaPlataforma,
      valor_total: valor, status: 'CONCLUIDO', gateway_txid: `PIX_DIRETO_${Date.now()}`,
    }]).select().single();
    if (error) throw error;
    res.status(200).json({ message: 'Corrida registrada com sucesso!', transacao });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const consultarCarteira: RequestHandler = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const [{ data: usuario }, { data: transacoes, error }] = await Promise.all([
      supabase.from('Usuario').select('chave_pix, tipo_chave_pix').eq('id', usuarioId).single(),
      supabase.from('Transacao').select('*').eq('usuario_id', usuarioId),
    ]);
    if (error) throw error;
    const extrato = (transacoes ?? []).sort((a, b) => new Date(b.criado_em || b.criada_em || 0).getTime() - new Date(a.criado_em || a.criada_em || 0).getTime());
    const saldo = extrato.filter((item) => item.status === 'CONCLUIDO').reduce((total, item) => total + Number(item.valor), 0);
    res.status(200).json({ usuarioId, saldo: saldo.toFixed(2), chavePix: usuario?.chave_pix ?? null, tipoChavePix: usuario?.tipo_chave_pix ?? null, extrato });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
