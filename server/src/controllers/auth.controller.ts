import type { RequestHandler } from 'express';
import { supabase } from '../config/supabase.js';

type ArquivosCadastro = Record<string, Express.Multer.File[] | undefined>;

function lerDados(value: unknown) {
  if (typeof value !== 'string') return value ?? {};
  return JSON.parse(value);
}

async function salvarDocumento(usuarioId: string, arquivo: Express.Multer.File, pasta: string, tipoDocumento: string) {
  const extensao = arquivo.mimetype.split('/')[1] || 'jpg';
  const caminho = `${pasta}/${usuarioId}_${Date.now()}.${extensao}`;
  const { data, error } = await supabase.storage
    .from('documentos')
    .upload(caminho, arquivo.buffer, { contentType: arquivo.mimetype, upsert: true });

  if (error) throw error;
  const url = supabase.storage.from('documentos').getPublicUrl(data.path).data.publicUrl;
  const { error: fotoError } = await supabase
    .from('Foto')
    .insert([{ usuario_id: usuarioId, tipo_documento: tipoDocumento, url }]);
  if (fotoError) throw fotoError;
}

export const cadastrar: RequestHandler = async (req, res) => {
  try {
    const dadosPessoais = lerDados(req.body.dadosPessoais) as Record<string, string>;
    const dadosVeiculo = lerDados(req.body.dadosVeiculo) as Record<string, string>;
    const files = req.files as ArquivosCadastro | undefined;

    if (!dadosPessoais.nome || !dadosPessoais.cpf || !dadosPessoais.email || !dadosPessoais.senha) {
      res.status(400).json({ error: 'Preencha nome, CPF, e-mail e senha.' });
      return;
    }
    if (!dadosVeiculo.tipo || !dadosVeiculo.marcaModelo || !dadosVeiculo.placa || !files?.fotoCnh?.[0] || !files.fotoDocumento?.[0]) {
      res.status(400).json({ error: 'Preencha os dados do veículo e envie os dois documentos.' });
      return;
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from('Usuario')
      .insert([{
        nome: dadosPessoais.nome.trim(),
        cpf: dadosPessoais.cpf.trim(),
        email: dadosPessoais.email.trim().toLowerCase(),
        telefone: dadosPessoais.telefone?.trim() || null,
        senha: dadosPessoais.senha,
        tipo: 'ENTREGADOR',
        status: 'PENDENTE',
      }])
      .select()
      .single();

    if (usuarioError) {
      res.status(400).json({ error: `Erro ao criar usuário: ${usuarioError.message}` });
      return;
    }

    try {
      await Promise.all([
        salvarDocumento(usuario.id, files.fotoCnh[0], 'cnh', 'CNH'),
        salvarDocumento(usuario.id, files.fotoDocumento[0], 'veiculos', 'DOCUMENTO_VEICULO'),
      ]);
      const { error: veiculoError } = await supabase.from('Veiculo').insert([{
        usuario_id: usuario.id,
        tipo: dadosVeiculo.tipo,
        marca_modelo: dadosVeiculo.marcaModelo,
        placa: dadosVeiculo.placa.trim().toUpperCase(),
      }]);
      if (veiculoError) throw veiculoError;
    } catch (error: any) {
      await supabase.from('Usuario').delete().eq('id', usuario.id);
      throw error;
    }

    res.status(201).json({ message: 'Cadastro enviado para análise.', usuarioId: usuario.id, status: 'PENDENTE' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível concluir o cadastro.' });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const loginInformado = String(req.body.login ?? '').trim();
    const senha = String(req.body.senha ?? '');
    if (!loginInformado || !senha) {
      res.status(400).json({ error: 'Informe e-mail/CPF e senha.' });
      return;
    }

    const { data: usuario, error } = await supabase
      .from('Usuario')
      .select('*, Veiculo(*), Foto(*)')
      .or(`email.eq.${loginInformado.toLowerCase()},cpf.eq.${loginInformado}`)
      .eq('senha', senha)
      .maybeSingle();
    if (error || !usuario) {
      res.status(401).json({ error: 'E-mail/CPF ou senha inválidos.' });
      return;
    }
    if (usuario.tipo !== 'ADMIN' && usuario.status !== 'APROVADO') {
      res.status(403).json({ error: `Sua conta está com status "${usuario.status}".`, status: usuario.status });
      return;
    }
    res.status(200).json({ message: 'Login realizado com sucesso!', usuario });
  } catch {
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
};

export const recuperarSenha: RequestHandler = async (req, res) => {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase();
    const novaSenha = String(req.body.novaSenha ?? '');
    if (!email || novaSenha.length < 6) {
      res.status(400).json({ error: 'Informe seu e-mail e uma nova senha com pelo menos 6 caracteres.' });
      return;
    }
    const { data: usuario, error: buscaError } = await supabase.from('Usuario').select('id').eq('email', email).maybeSingle();
    if (buscaError || !usuario) {
      res.status(404).json({ error: 'Nenhuma conta foi encontrada para este e-mail.' });
      return;
    }
    const { error } = await supabase.from('Usuario').update({ senha: novaSenha }).eq('id', usuario.id);
    if (error) throw error;
    res.status(200).json({ message: 'Senha atualizada com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível atualizar a senha.' });
  }
};
