import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';

async function ehAdministrador(adminId: unknown) {
  if (!adminId) return false;
  const { data } = await supabase
    .from('Usuario')
    .select('id')
    .eq('id', String(adminId))
    .eq('tipo', 'ADMIN')
    .maybeSingle();
  return Boolean(data);
}

export const listarPendentes: RequestHandler = async (req, res) => {
  try {
    if (!(await ehAdministrador(req.query.adminId))) {
      res.status(403).json({ error: 'Acesso restrito a administradores.' });
      return;
    }
    const { data, error } = await supabase
      .from('Usuario')
      .select('id, nome, cpf, email, telefone, status, Veiculo(*), Foto(*)')
      .eq('status', 'PENDENTE');
    if (error) throw error;
    res.status(200).json({ cadastros: data ?? [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível buscar os cadastros.' });
  }
};

export const decidirCadastro: RequestHandler = async (req, res) => {
  try {
    const { adminId, usuarioId, decisao } = req.body;
    if (!(await ehAdministrador(adminId))) {
      res.status(403).json({ error: 'Acesso restrito a administradores.' });
      return;
    }
    if (!usuarioId || !['APROVADO', 'REPROVADO'].includes(decisao)) {
      res.status(400).json({ error: 'Informe o cadastro e uma decisão válida.' });
      return;
    }
    const { data, error } = await supabase
      .from('Usuario')
      .update({ status: decisao })
      .eq('id', usuarioId)
      .select('id, nome, status')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Cadastro não encontrado.' });
      return;
    }
    res.status(200).json({ message: `Cadastro ${decisao.toLowerCase()} com sucesso.`, usuario: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível atualizar o cadastro.' });
  }
};
