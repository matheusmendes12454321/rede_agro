import express from 'express';
import type { RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { validarDocumentoComOCR } from './validador.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERRO CRÍTICO] SUPABASE_URL ou SUPABASE_KEY não configuradas no .env!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Multer (Armazenamento temporário em memória RAM)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB por arquivo
});

const uploadFields = upload.fields([
  { name: 'fotoCnh', maxCount: 1 },
  { name: 'fotoDocumento', maxCount: 1 }
]);

/**
 * Handler de Processamento de Cadastro e Validação OCR
 */
const processarCadastro: RequestHandler = async (req, res) => {
  console.log('\n==================================================');
  console.log('[LOG INIT] Nova requisição de cadastro recebida.');

  try {
    const dadosPessoais = typeof req.body.dadosPessoais === 'string'
      ? JSON.parse(req.body.dadosPessoais)
      : req.body.dadosPessoais || {};

    const dadosVeiculo = typeof req.body.dadosVeiculo === 'string'
      ? JSON.parse(req.body.dadosVeiculo)
      : req.body.dadosVeiculo || {};

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let statusFinal = 'PENDENTE';
    let cnhValida = false;
    let docValido = false;

    // 1. Validação OCR Automática da CNH (CPF)
    if (files?.fotoCnh?.[0] && dadosPessoais.cpf) {
      console.log('[OCR] Analisando imagem da CNH...');
      const resultadoCnh = await validarDocumentoComOCR(files.fotoCnh[0].buffer, dadosPessoais.cpf);
      cnhValida = resultadoCnh.valido;
      console.log(`[OCR CNH] CPF encontrado na imagem? ${cnhValida ? 'SIM' : 'NÃO'}`);
    }

    // 2. Validação OCR Automática do Veículo (Placa)
    if (files?.fotoDocumento?.[0] && dadosVeiculo.placa) {
      console.log('[OCR] Analisando imagem do documento do veículo...');
      const resultadoDoc = await validarDocumentoComOCR(files.fotoDocumento[0].buffer, dadosVeiculo.placa);
      docValido = resultadoDoc.valido;
      console.log(`[OCR VEÍCULO] Placa encontrada na imagem? ${docValido ? 'SIM' : 'NÃO'}`);
    }

    // Aprovação automática se ambos forem validados pelo Tesseract.js
    if (cnhValida && docValido) {
      statusFinal = 'APROVADO';
    }

    // 3. Inserir Usuário no Supabase (Tabela "Usuario")
    const { data: novoUsuario, error: errUsuario } = await supabase
      .from('Usuario')
      .insert([{
        nome: dadosPessoais.nome,
        cpf: dadosPessoais.cpf,
        email: dadosPessoais.email,
        telefone: dadosPessoais.telefone,
        senha: dadosPessoais.senha,
        tipo: 'ENTREGADOR',
        status: statusFinal
      }])
      .select()
      .single();

    if (errUsuario) {
      console.error('[ERRO SUPABASE - USUARIO]:', errUsuario.message);
      res.status(400).json({ error: `Erro ao criar usuário: ${errUsuario.message}` });
      return;
    }

    console.log('[SUCESSO] Usuário cadastrado. ID:', novoUsuario.id);

    let urlPublicaCnh = '';
    let urlPublicaDoc = '';

    // 4. Upload da CNH para o Storage e inserção na tabela "Foto"
    if (files?.fotoCnh?.[0]) {
      const fileCnh = files.fotoCnh[0];
      const ext = fileCnh.originalname.split('.').pop() || 'jpg';
      const pathCnh = `cnh/${novoUsuario.id}_${Date.now()}.${ext}`;

      const { data: uploadData, error: errUploadCnh } = await supabase.storage
        .from('documentos')
        .upload(pathCnh, fileCnh.buffer, { contentType: fileCnh.mimetype || 'image/jpeg', upsert: true });

      if (errUploadCnh) {
        console.error('[ERRO STORAGE CNH]:', errUploadCnh.message);
      } else {
        urlPublicaCnh = supabase.storage.from('documentos').getPublicUrl(uploadData.path).data.publicUrl;

        await supabase.from('Foto').insert([{
          usuario_id: novoUsuario.id,
          tipo_documento: 'CNH',
          url: urlPublicaCnh
        }]);
      }
    }

    // 5. Upload do Documento do Veículo para o Storage e inserção na tabela "Foto"
    if (files?.fotoDocumento?.[0]) {
      const fileDoc = files.fotoDocumento[0];
      const ext = fileDoc.originalname.split('.').pop() || 'jpg';
      const pathDoc = `veiculos/${novoUsuario.id}_${Date.now()}.${ext}`;

      const { data: uploadData, error: errUploadDoc } = await supabase.storage
        .from('documentos')
        .upload(pathDoc, fileDoc.buffer, { contentType: fileDoc.mimetype || 'image/jpeg', upsert: true });

      if (errUploadDoc) {
        console.error('[ERRO STORAGE DOC]:', errUploadDoc.message);
      } else {
        urlPublicaDoc = supabase.storage.from('documentos').getPublicUrl(uploadData.path).data.publicUrl;

        await supabase.from('Foto').insert([{
          usuario_id: novoUsuario.id,
          tipo_documento: 'DOC_VEICULO',
          url: urlPublicaDoc
        }]);
      }
    }

    // 6. Cadastrar dados do Veículo na tabela "Veiculo"
    const { error: errVeiculo } = await supabase.from('Veiculo').insert([{
      usuario_id: novoUsuario.id,
      tipo: dadosVeiculo.tipo,
      marca_modelo: dadosVeiculo.marcaModelo,
      placa: dadosVeiculo.placa
    }]);

    if (errVeiculo) {
      console.error('[ERRO SUPABASE - VEICULO]:', errVeiculo.message);
    }

    res.status(201).json({
      message: 'Cadastro processado com sucesso!',
      usuarioId: novoUsuario.id,
      status: statusFinal,
      validacaoAutomatica: {
        cnhAprovada: cnhValida,
        documentoVeiculoAprovado: docValido
      }
    });

  } catch (error: any) {
    console.error('[ERRO CRÍTICO NO CADASTRO]:', error);
    res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
  }
};

/**
 * Handler de Autenticação / Login
 */
const processarLogin: RequestHandler = async (req, res) => {
  try {
    const { login, senha } = req.body;

    if (!login || !senha) {
      res.status(400).json({ error: 'Informe o e-mail/CPF e a senha.' });
      return;
    }

    const termoLogin = String(login).trim();

    // 1. Busca o usuário no Supabase
    const { data: usuario, error } = await supabase
      .from('Usuario')
      .select(`
        id, nome, cpf, email, telefone, tipo, status,
        Veiculo (*),
        Foto (*)
      `)
      .or(`email.eq.${termoLogin},cpf.eq.${termoLogin}`)
      .eq('senha', senha)
      .maybeSingle();

    if (error) {
      console.error('[ERRO DB LOGIN]:', error.message);
      res.status(500).json({ error: 'Erro ao consultar banco de dados.' });
      return;
    }

    // 2. Valida se a conta existe / senha bate
    if (!usuario) {
      res.status(401).json({ error: 'E-mail/CPF ou senha inválidos.' });
      return;
    }

    // 3. TRAVA DE SEGURANÇA: Verifica se a conta está APROVADA
    if (usuario.status !== 'APROVADO') {
      res.status(403).json({ 
        error: `Sua conta está com status "${usuario.status}". Aguarde a análise dos documentos para acessar o aplicativo.` 
      });
      return;
    }

    // Retorna os dados se estiver tudo certo
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      usuario
    });

  } catch (error: any) {
    console.error('[ERRO NO HANDLER DE LOGIN]:', error);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
};

// Configuração das Rotas
app.post('/cadastrar', uploadFields, processarCadastro);
app.post('/api/cadastrar', uploadFields, processarCadastro);

app.post('/login', processarLogin);
app.post('/api/login', processarLogin);

// Inicialização do Servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVIDOR OK] API rodando na porta ${PORT}`);
});