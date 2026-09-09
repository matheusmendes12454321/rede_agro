import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';
import { exigirUsuarioDaSessao } from '../middlewares/auth.js';
import { uploadDocumento } from '../controllers/auth.controller.js';

export const obterPerfil: RequestHandler = async (req, res) => {
  try {
    const { data, error } = await supabase.from('Usuario')
      .select('id, nome, cpf, email, telefone, tipo, status, chave_pix, tipo_chave_pix, disponivel, Veiculo(*), Foto(*)')
      .eq('id', req.auth!.usuarioId)
      .single();
    if (error) throw error;
    res.json({ perfil: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível carregar o perfil.' });
  }
};

export const atualizarPerfil: RequestHandler = async (req, res) => {
  try {
    const usuarioId = req.auth!.usuarioId;
    const { nome, telefone, email, veiculo } = req.body as { nome?: string; telefone?: string; email?: string; veiculo?: { tipo?: string; marcaModelo?: string; placa?: string } };
    const usuario: Record<string, string> = {};
    if (nome?.trim()) usuario.nome = nome.trim();
    if (telefone !== undefined) usuario.telefone = telefone.trim();
    if (email?.trim()) usuario.email = email.trim().toLowerCase();
    if (Object.keys(usuario).length) {
      const { error } = await supabase.from('Usuario').update(usuario).eq('id', usuarioId);
      if (error) throw error;
    }
    if (veiculo) {
      const dados: Record<string, string> = {};
      if (veiculo.tipo?.trim()) dados.tipo = veiculo.tipo.trim();
      if (veiculo.marcaModelo?.trim()) dados.marca_modelo = veiculo.marcaModelo.trim();
      if (veiculo.placa?.trim()) dados.placa = veiculo.placa.trim().toUpperCase();
      if (Object.keys(dados).length) {
        const { data: existente, error: buscaError } = await supabase.from('Veiculo').select('id').eq('usuario_id', usuarioId).maybeSingle();
        if (buscaError) throw buscaError;
        const { error } = existente
          ? await supabase.from('Veiculo').update(dados).eq('id', existente.id)
          : await supabase.from('Veiculo').insert({ usuario_id: usuarioId, ...dados });
        if (error) throw error;
      }
    }
    res.json({ message: 'Perfil atualizado com sucesso.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Não foi possível atualizar o perfil.' });
  }
};

export const reenviarDocumentos: RequestHandler = async (req, res) => {
  try {
    const usuarioId = req.auth!.usuarioId;
    const arquivos = req.files as Record<string, Express.Multer.File[] | undefined> | undefined;
    const cnh = arquivos?.fotoCnh?.[0];
    const documento = arquivos?.fotoDocumento?.[0];
    if (!cnh && !documento) {
      res.status(400).json({ error: 'Envie ao menos um documento.' });
      return;
    }
    if (cnh) await uploadDocumento(usuarioId, cnh, 'cnh', 'CNH');
    if (documento) await uploadDocumento(usuarioId, documento, 'veiculos', 'DOCUMENTO_VEICULO');
    const { error } = await supabase.from('Usuario').update({ status: 'PENDENTE' }).eq('id', usuarioId);
    if (error) throw error;
    res.json({ message: 'Documentos enviados para nova análise.', status: 'PENDENTE' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível enviar os documentos.' });
  }
};
