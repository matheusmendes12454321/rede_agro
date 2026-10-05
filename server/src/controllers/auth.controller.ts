import type { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { enviarCodigoWhatsApp, validarCodigoWhatsApp } from '../services/whatsapp.service.js';

type ArquivosCadastro = Record<string, Express.Multer.File[] | undefined>;

function lerDados(value: unknown) {
  if (typeof value !== 'string') return value ?? {};
  return JSON.parse(value);
}

function telefoneComparavel(value: unknown) {
  const digitos = String(value ?? '').replace(/\D/g, '');
  return digitos.length >= 12 && digitos.startsWith('55') ? digitos.slice(2) : digitos;
}

export async function uploadDocumento(usuarioId: string, arquivo: Express.Multer.File, pasta: string, tipoDocumento: string) {
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
        senha: await bcrypt.hash(dadosPessoais.senha, 12),
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
        uploadDocumento(usuario.id, files.fotoCnh[0], 'cnh', 'CNH'),
        uploadDocumento(usuario.id, files.fotoDocumento[0], 'veiculos', 'DOCUMENTO_VEICULO'),
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
      .select('id, nome, cpf, email, telefone, tipo, status, senha, Veiculo(*), Foto(*)')
      .or(`email.eq.${loginInformado.toLowerCase()},cpf.eq.${loginInformado}`)
      .maybeSingle();

    if (error || !usuario) {
      res.status(401).json({ error: 'E-mail/CPF ou senha inválidos.' });
      return;
    }

    let senhaValida = false;

    if (usuario.senha.startsWith('$2a$') || usuario.senha.startsWith('$2b$')) {
      senhaValida = await bcrypt.compare(senha, usuario.senha);
    } else {
      senhaValida = (senha === usuario.senha);
      if (senhaValida) {
        const novaSenhaHash = await bcrypt.hash(senha, 12);
        await supabase.from('Usuario').update({ senha: novaSenhaHash }).eq('id', usuario.id);
      }
    }

    if (!senhaValida) {
      res.status(401).json({ error: 'E-mail/CPF ou senha inválidos.' });
      return;
    }

    if (usuario.tipo !== 'ADMIN' && usuario.status !== 'APROVADO') {
      res.status(403).json({ error: `Sua conta está com status "${usuario.status}".`, status: usuario.status });
      return;
    }

    const segredo = process.env.JWT_SECRET;
    if (!segredo) throw new Error('JWT_SECRET não está configurado no servidor.');

    const token = jwt.sign({ usuarioId: usuario.id, tipo: usuario.tipo }, segredo, { expiresIn: '7d' });
    const { senha: _senha, ...usuarioSeguro } = usuario;

    res.status(200).json({ message: 'Login realizado com sucesso!', usuario: usuarioSeguro, token });
  }catch (err: any) {
    console.error('[ERRO INTERNO LOGIN DETALHADO]:', err.message, err.stack);
    res.status(500).json({ error: err.message || 'Erro interno ao realizar login.' });
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
    const { error } = await supabase.from('Usuario').update({ senha: await bcrypt.hash(novaSenha, 12) }).eq('id', usuario.id);
    if (error) throw error;
    res.status(200).json({ message: 'Senha atualizada com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível atualizar a senha.' });
  }
};

export const enviarCodigoRecuperacao: RequestHandler = async (req, res) => {
  try {
    const telefone = String(req.body.telefone ?? '').trim();
    if (telefone.replace(/\D/g, '').length < 10) {
      res.status(400).json({ error: 'Informe o telefone cadastrado, com DDD.' });
      return;
    }
    const telefoneNormalizado = telefoneComparavel(telefone);
    const { data: usuarios, error } = await supabase.from('Usuario').select('id, telefone').not('telefone', 'is', null);
    const usuario = usuarios?.find((item) => telefoneComparavel(item.telefone) === telefoneNormalizado);
    if (error || !usuario?.telefone) {
      res.status(404).json({ error: 'Nenhuma conta foi encontrada para este telefone.' });
      return;
    }
    const resultado = await enviarCodigoWhatsApp(usuario.telefone);
    res.status(200).json({ message: 'Código enviado para o WhatsApp cadastrado.', ...(resultado.modo === 'desenvolvimento' ? { codigoDev: resultado.codigoDev } : {}) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível enviar o código.' });
  }
};

export const redefinirSenhaComCodigo: RequestHandler = async (req, res) => {
  try {
    const telefone = String(req.body.telefone ?? '').trim();
    const codigo = String(req.body.codigo ?? '').trim();
    const novaSenha = String(req.body.novaSenha ?? '');
    if (!telefone || !codigo || novaSenha.length < 6) {
      res.status(400).json({ error: 'Informe telefone, código e uma senha com pelo menos 6 caracteres.' });
      return;
    }
    const validacao = validarCodigoWhatsApp(telefone, codigo);
    if (!validacao.valido) {
      res.status(400).json({ error: validacao.erro });
      return;
    }
    const telefoneNormalizado = telefoneComparavel(telefone);
    const { data: usuarios, error: buscaError } = await supabase.from('Usuario').select('id, telefone').not('telefone', 'is', null);
    const usuario = usuarios?.find((item) => telefoneComparavel(item.telefone) === telefoneNormalizado);
    if (buscaError || !usuario) {
      res.status(404).json({ error: 'Nenhuma conta foi encontrada para este telefone.' });
      return;
    }
    const { error } = await supabase.from('Usuario').update({ senha: await bcrypt.hash(novaSenha, 12) }).eq('id', usuario.id);
    if (error) throw error;
    res.status(200).json({ message: 'Senha atualizada com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Não foi possível atualizar a senha.' });
  }
};
