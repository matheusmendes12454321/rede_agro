import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';

const proximoStatus: Record<string, string> = { 
  ACEITO: 'A_CAMINHO_COLETA', 
  A_CAMINHO_COLETA: 'COLETADO', 
  COLETADO: 'A_CAMINHO_ENTREGA' 
};

function normalizarEntrega(entrega: Record<string, any>) {
  return {
    ...entrega,
    endereco_coleta: entrega.endereco_coleta ?? entrega.endereco_origem ?? entrega.endereco ?? null,
    endereco_entrega: entrega.endereco_entrega ?? entrega.endereco_destino ?? null,
  };
}

export const atualizarDisponibilidade: RequestHandler = async (req, res) => {
  try {
    const { disponivel, latitude, longitude } = req.body;
    if (typeof disponivel !== 'boolean') { 
      res.status(400).json({ error: 'Informe o status de disponibilidade.' }); 
      return; 
    }
    const dados: Record<string, unknown> = { disponivel, ultima_localizacao_em: new Date().toISOString() };
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      Object.assign(dados, { ultima_latitude: latitude, ultima_longitude: longitude });
    }
    const { data, error } = await supabase.from('Usuario').update(dados).eq('id', req.auth!.usuarioId).select('disponivel').single();
    if (error) throw error;
    res.json({ disponivel: data.disponivel });
  } catch (error: any) { 
    res.status(500).json({ error: error.message || 'Não foi possível atualizar a disponibilidade.' }); 
  }
};

export const listarEntregas: RequestHandler = async (req, res) => {
  try {
    if (!req.auth || !req.auth.usuarioId) {
      res.status(401).json({ error: 'Não autorizado. Token ausente ou inválido.' });
      return;
    }

    const { data, error } = await supabase
      .from('Entrega')
      .select('*')
      .eq('entregador_id', req.auth.usuarioId)
      .in('status', ['ACEITO', 'A_CAMINHO_COLETA', 'COLETADO', 'A_CAMINHO_ENTREGA'])
      .order('criado_em', { ascending: false });

    if (error) throw error;
    res.json({ entregas: (data ?? []).map(normalizarEntrega) });
  } catch (error: any) {
    console.error('[ERRO LISTAR ENTREGAS]:', error.message);
    res.status(500).json({ error: error.message || 'Não foi possível buscar entregas.' });
  }
};

export const criarEntregaTeste: RequestHandler = async (req, res) => {
  try {
    const { indice } = req.body;
    
    const pedidosSimulados = [
      { loja: 'Mercado Bom Preço', endereco: 'Av. Central, 120', itens: '2 itens • Mercado', clienteNome: 'Mariana Souza', clienteTelefone: '33999576713', latitude: -16.17953, longitude: -40.69489, valor: 0.01, metodo: 'PIX' },
      { loja: 'Farmácia Vida', endereco: 'Rua do Comércio, 42', itens: '1 item • Farmácia', clienteNome: 'Rafael Lima', clienteTelefone: '33999705058', latitude: -16.17953, longitude: -40.69489, valor: 9.00, metodo: 'CARTAO' },
      { loja: 'Restaurante da Praça', endereco: 'Praça Brasil, 15', itens: '3 itens • Alimentação', clienteNome: 'Camila Alves', clienteTelefone: '33987220462', latitude: -16.17953, longitude: -40.69489, valor: 15.75, metodo: 'DINHEIRO' }
    ];

    const pedidoSelecionado = pedidosSimulados[indice];
    if (!pedidoSelecionado) {
      res.status(400).json({ error: 'Pedido de teste inválido.' });
      return;
    }

    const { data, error } = await supabase.from('Entrega').insert([
      {
        loja: pedidoSelecionado.loja,
        endereco: pedidoSelecionado.endereco,
        endereco_origem: `${pedidoSelecionado.loja} — ${pedidoSelecionado.endereco}`,
        endereco_destino: 'SQN 208, Brasília - DF',
        endereco_coleta: `${pedidoSelecionado.loja} — ${pedidoSelecionado.endereco}`,
        endereco_entrega: 'IFNMG CAMPUS ALMENARA - BR 367',
        cliente_nome: pedidoSelecionado.clienteNome,
        cliente_telefone: pedidoSelecionado.clienteTelefone,
        lat_coleta: pedidoSelecionado.latitude,
        lng_coleta: pedidoSelecionado.longitude,
        lat_entrega: -16.2290,
        lng_entrega: -40.7439,
        itens: pedidoSelecionado.itens,
        valor: pedidoSelecionado.valor,
        metodo_pagamento: pedidoSelecionado.metodo,
        entregador_id: req.auth!.usuarioId,
        status: 'ACEITO'
      }
    ]).select().single();

    if (error) throw error;

    res.status(201).json({ message: 'Pedido aceito com sucesso!', entrega: normalizarEntrega(data) });
  } catch (error: any) {
    console.error('[ERRO TESTE ENTREGA]:', error.message);
    res.status(500).json({ error: error.message || 'Erro ao processar pedido de teste.' });
  }
};

export const aceitarEntrega: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase.from('Entrega').update({ entregador_id: req.auth!.usuarioId, status: 'ACEITO' }).eq('id', req.params.entregaId).eq('status', 'DISPONIVEL').select().maybeSingle();
    if (error) throw error;
    if (!data) { 
      res.status(409).json({ error: 'Esta entrega não está mais disponível.' }); 
      return; 
    }
    res.json({ entrega: normalizarEntrega(data) });
  } catch (error: any) { 
    res.status(500).json({ error: error.message || 'Não foi possível aceitar a entrega.' }); 
  }
};

export const recusarEntrega: RequestHandler = async (_req, res) => res.status(204).send();

async function minhaEntrega(id: string, usuarioId: string) {
  const { data, error } = await supabase.from('Entrega').select('*').eq('id', id).eq('entregador_id', usuarioId).maybeSingle();
  if (error) throw error;
  return data;
}

export const obterEntrega: RequestHandler = async (req, res) => {
  try {
    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega) {
      res.status(404).json({ error: 'Entrega não encontrada.' });
      return;
    }
    res.json({ entrega: normalizarEntrega(entrega) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível buscar a entrega.' });
  }
};

export const atualizarStatusEntrega: RequestHandler = async (req, res) => {
  try {
    console.log('--- TENTATIVA DE ATUALIZAÇÃO DE STATUS ---');
    console.log('CORPO RECEBIDO DO APP (req.body):', req.body);
    console.log('ID DA ENTREGA (params):', req.params.entregaId);

    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega) { 
      console.log('ERRO: Entrega não encontrada.');
      res.status(404).json({ error: 'Entrega não encontrada.' }); 
      return; 
    }

    console.log('STATUS ATUAL NO BANCO:', entrega.status);
    const proximoEsperado = proximoStatus[entrega.status];
    console.log('PRÓXIMO STATUS ESPERADO:', proximoEsperado);

    const novoStatus = String(req.body.novoStatus ?? '');
    console.log('NOVO STATUS ENVIADO PELO APP:', novoStatus);

    if (proximoEsperado !== novoStatus) { 
      console.log(`FALHA DE TRANSIÇÃO: Esperava "${proximoEsperado}", mas recebeu "${novoStatus}".`);
      res.status(400).json({ error: 'Transição de status inválida.' }); 
      return; 
    }

    const { data, error } = await supabase.from('Entrega').update({ status: novoStatus }).eq('id', entrega.id).select().single();
    if (error) throw error;

    console.log('SUCESSO! Status atualizado para:', data.status);
    res.json({ entrega: normalizarEntrega(data) });
  } catch (error: any) { 
    console.error('[ERRO FATAL NO STATUS]:', error.message);
    res.status(500).json({ error: error.message || 'Não foi possível atualizar a entrega.' }); 
  }
};

export const confirmarCodigo: RequestHandler = async (req, res) => {
  try {
    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega || entrega.status !== 'A_CAMINHO_ENTREGA') { 
      res.status(400).json({ error: 'Entrega não está pronta para confirmação.' }); 
      return; 
    }
    if (entrega.pagamento_status !== 'APROVADO') {
      res.status(400).json({ error: 'Confirme o pagamento antes de concluir a entrega.' });
      return;
    }
    if (!entrega.codigo_confirmacao || String(req.body.codigo ?? '').trim() !== entrega.codigo_confirmacao) { 
      res.status(400).json({ error: 'Código de confirmação inválido.' }); 
      return; 
    }
    const { data, error } = await supabase.from('Entrega').update({ status: 'ENTREGUE' }).eq('id', entrega.id).select().single();
    if (error) throw error;
    res.json({ entrega: normalizarEntrega(data) });
  } catch (error: any) { 
    res.status(500).json({ error: error.message || 'Não foi possível confirmar a entrega.' }); 
  }
};

export const confirmarFoto = async (req: any, res: any) => {
  try {
    const { entregaId } = req.params;
    const arquivo = req.file || (req.files && req.files[0]);

    if (!arquivo || !arquivo.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Envie uma foto válida para comprovar a entrega.' });
    }

    const entrega = await minhaEntrega(String(entregaId), req.auth!.usuarioId);
    if (!entrega || entrega.status !== 'A_CAMINHO_ENTREGA') {
      return res.status(400).json({ error: 'Entrega não está pronta para confirmação.' });
    }
    if (entrega.pagamento_status !== 'APROVADO') {
      return res.status(400).json({ error: 'Confirme o pagamento antes de concluir a entrega.' });
    }

    const caminho = `comprovantes/${entrega.id}_${Date.now()}.${arquivo.mimetype.split('/')[1] || 'jpg'}`;
    const { data: arquivoSalvo, error: erroUpload } = await supabase.storage
      .from('documentos')
      .upload(caminho, arquivo.buffer, { contentType: arquivo.mimetype, upsert: true });
    if (erroUpload) throw erroUpload;
    const fotoUrl = supabase.storage.from('documentos').getPublicUrl(arquivoSalvo.path).data.publicUrl;

    const { data, error } = await supabase
      .from('Entrega')
      .update({ status: 'ENTREGUE', foto_confirmacao_url: fotoUrl })
      .eq('id', entrega.id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, entrega: normalizarEntrega(data), message: 'Entrega concluída com foto!' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao confirmar foto.' });
  }
};

export const avaliarEntrega: RequestHandler = async (req, res) => {
  try {
    const entrega = await minhaEntrega(String(req.params.entregaId), req.auth!.usuarioId);
    if (!entrega || entrega.status !== 'ENTREGUE') {
      res.status(404).json({ error: 'Entrega concluída não encontrada.' });
      return;
    }
    const nota = Number(req.body.nota);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      res.status(400).json({ error: 'Escolha uma nota de 1 a 5.' });
      return;
    }
    const { error } = await supabase.from('Entrega').update({ avaliacao_cliente: nota }).eq('id', entrega.id);
    if (error) throw error;
    res.json({ message: 'Avaliação salva. Obrigado!', nota });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível salvar a avaliação.' });
  }
};
