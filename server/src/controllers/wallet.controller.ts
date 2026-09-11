import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';
import { exigirUsuarioDaSessao } from '../middlewares/auth.js';

function saldoDisponivel(transacoes: Array<{ tipo?: string; valor?: number | string; status?: string }>) {
  return transacoes.reduce((saldo, transacao) => {
    if (transacao.status !== 'CONCLUIDO' && transacao.status !== 'PENDENTE') return saldo;
    const valor = Number(transacao.valor ?? 0);
    return transacao.tipo === 'DEBITO' ? saldo - valor : saldo + valor;
  }, 0);
}

export const salvarChavePix: RequestHandler = async (req, res) => {
  try {
    const { chavePix, tipoChave } = req.body;
    if (!chavePix || !tipoChave) { res.status(400).json({ error: 'Informe chave Pix e tipo da chave.' }); return; }
    const { data, error } = await supabase.from('Usuario').update({ chave_pix: String(chavePix).trim(), tipo_chave_pix: String(tipoChave).toUpperCase().trim() }).eq('id', req.auth!.usuarioId).select('id').maybeSingle();
    if (error) throw error;
    if (!data) { res.status(404).json({ error: 'Seu perfil não foi encontrado. Saia e entre na conta novamente.' }); return; }
    res.json({ message: 'Chave Pix cadastrada com sucesso!' });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Não foi possível salvar a chave Pix.' }); }
};

export const consultarCarteira: RequestHandler = async (req, res) => {
  try {
    const usuarioId = req.params.usuarioId;
    if (!exigirUsuarioDaSessao(usuarioId, req.auth)) { res.status(403).json({ error: 'Você não pode consultar a carteira de outro usuário.' }); return; }
    const [{ data: usuario, error: usuarioError }, { data: transacoes, error: transacoesError }] = await Promise.all([
      supabase.from('Usuario').select('chave_pix, tipo_chave_pix').eq('id', usuarioId).single(),
      supabase.from('Transacao').select('*').eq('usuario_id', usuarioId).order('criado_em', { ascending: false }),
    ]);
    if (usuarioError || transacoesError) throw usuarioError || transacoesError;
    const extrato = transacoes ?? [];
    res.json({ usuarioId, saldo: saldoDisponivel(extrato).toFixed(2), chavePix: usuario?.chave_pix ?? null, tipoChavePix: usuario?.tipo_chave_pix ?? null, extrato });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Não foi possível consultar a carteira.' }); }
};

export const solicitarSaque: RequestHandler = async (req, res) => {
  try {
    const valor = Number(req.body.valor);
    if (!Number.isFinite(valor) || valor <= 0) { res.status(400).json({ error: 'Informe um valor de saque válido.' }); return; }
    const usuarioId = req.auth!.usuarioId;
    const { data: transacoes, error } = await supabase.from('Transacao').select('tipo, valor, status').eq('usuario_id', usuarioId);
    if (error) throw error;
    const saldo = saldoDisponivel(transacoes ?? []);
    if (valor > saldo) { res.status(400).json({ error: 'Saldo insuficiente para solicitar este saque.', saldoDisponivel: saldo.toFixed(2) }); return; }
    const { data: saque, error: saqueError } = await supabase.from('Transacao').insert({ usuario_id: usuarioId, tipo: 'DEBITO', valor, valor_total: valor, taxa_plataforma: 0, status: 'PENDENTE', gateway_txid: `SAQUE_${Date.now()}` }).select().single();
    if (saqueError) throw saqueError;
    res.status(201).json({ message: 'Solicitação de saque registrada.', saque, saldo: (saldo - valor).toFixed(2) });
  } catch (error: any) { res.status(500).json({ error: error.message || 'Não foi possível solicitar o saque.' }); }
};

export const registrarCorrida: RequestHandler = async (req, res) => {
  try {
    const { entregadorId, entregaId, valorTotal } = req.body;
    const valor = Number(valorTotal);
    if (!entregadorId || entregadorId !== req.auth!.usuarioId || !Number.isFinite(valor) || valor <= 0) {
      res.status(400).json({ error: 'Informe entregadorId e um valorTotal válido.' });
      return;
    }
    if (entregaId) {
      const { data: existente, error: existenteError } = await supabase.from('Transacao').select('id').eq('entrega_id', entregaId).maybeSingle();
      if (existenteError) throw existenteError;
      if (existente) { res.status(200).json({ message: 'Ganho já registrado para esta entrega.', transacao: existente }); return; }
      const { data: entrega, error: entregaError } = await supabase.from('Entrega').select('pagamento_status').eq('id', entregaId).eq('entregador_id', entregadorId).maybeSingle();
      if (entregaError) throw entregaError;
      if (!entrega || entrega.pagamento_status !== 'APROVADO') { res.status(400).json({ error: 'Confirme o pagamento antes de registrar o ganho.' }); return; }
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
