import express from 'express';
import type { RequestHandler } from 'express';import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
// Utilize a SERVICE_ROLE key se configurada no .env para dar bypass no RLS pelo backend
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração do Multer (Armazenamento em memória para extrair o Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // Limite de 10MB por arquivo
});

const uploadFields = upload.fields([
  { name: 'fotoCnh', maxCount: 1 },
  { name: 'fotoDocumento', maxCount: 1 }
]);

const processarCadastro: RequestHandler = async (req, res) => {
  console.log('--------------------------------------------------');
  console.log('[LOG] Requisição de cadastro recebida.');

  try {
    // 1. Parsing seguro dos campos JSON enviados via FormData
    const dadosPessoais = typeof req.body.dadosPessoais === 'string'
      ? JSON.parse(req.body.dadosPessoais)
      : req.body.dadosPessoais || {};

    const dadosVeiculo = typeof req.body.dadosVeiculo === 'string'
      ? JSON.parse(req.body.dadosVeiculo)
      : req.body.dadosVeiculo || {};

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    console.log('[LOG] Nome do Entregador:', dadosPessoais.nome);
    console.log('[LOG] Arquivos Recebidos:', files ? Object.keys(files) : 'Nenhum');

    // 2. Inserir Entregador no Supabase
    const { data: novoEntregador, error: errEntregador } = await supabase
      .from('entregadores')
      .insert([{
        nome: dadosPessoais.nome,
        cpf: dadosPessoais.cpf,
        telefone: dadosPessoais.telefone,
        email: dadosPessoais.email,
        senha: dadosPessoais.senha,
        endereco: dadosPessoais.endereco,
        status_aprovacao: 'PENDENTE'
      }])
      .select()
      .single();

    if (errEntregador) {
      console.error('[ERRO SUPABASE - ENTREGADOR]:', errEntregador.message);
      res.status(400).json({ error: `Erro ao criar entregador: ${errEntregador.message}` });
      return;
    }

    let pathCnh: string | null = null;
    let pathDoc: string | null = null;

    // 3. Upload da foto da CNH no Supabase Storage
    if (files?.fotoCnh?.[0]) {
      const fileCnh = files.fotoCnh[0];
      const ext = fileCnh.originalname.split('.').pop() || 'jpg';
      pathCnh = `cnh/${novoEntregador.id}_${Date.now()}.${ext}`;

      const { data: uploadCnhData, error: errCnh } = await supabase.storage
        .from('documentos')
        .upload(pathCnh, fileCnh.buffer, {
          contentType: fileCnh.mimetype || 'image/jpeg',
          upsert: true
        });

      if (errCnh) {
        console.error('[ERRO STORAGE - CNH]:', errCnh.message);
      } else {
        console.log('[SUCESSO STORAGE - CNH]:', uploadCnhData.path);
      }
    }

    // 4. Upload do Documento do Veículo no Supabase Storage
    if (files?.fotoDocumento?.[0]) {
      const fileDoc = files.fotoDocumento[0];
      const ext = fileDoc.originalname.split('.').pop() || 'jpg';
      pathDoc = `documentos/${novoEntregador.id}_${Date.now()}.${ext}`;

      const { data: uploadDocData, error: errDoc } = await supabase.storage
        .from('documentos')
        .upload(pathDoc, fileDoc.buffer, {
          contentType: fileDoc.mimetype || 'image/jpeg',
          upsert: true
        });

      if (errDoc) {
        console.error('[ERRO STORAGE - DOC]:', errDoc.message);
      } else {
        console.log('[SUCESSO STORAGE - DOC]:', uploadDocData.path);
      }
    }

    // 5. Atualizar entregador com os caminhos das imagens
    if (pathCnh || pathDoc) {
      const { error: errUpdate } = await supabase
        .from('entregadores')
        .update({
          foto_cnh_url: pathCnh,
          foto_documento_url: pathDoc,
          status_documentacao: 'EM_ANALISE'
        })
        .eq('id', novoEntregador.id);

      if (errUpdate) {
        console.error('[ERRO UPDATE URLS]:', errUpdate.message);
      } else {
        console.log('[SUCESSO DB UPDATE] URLs salvas para o ID:', novoEntregador.id);
      }
    }

    // 6. Cadastrar o Veículo no Supabase
    const { error: errVeiculo } = await supabase
      .from('veiculos')
      .insert([{
        entregador_id: novoEntregador.id,
        tipo: dadosVeiculo.tipo,
        marca_modelo: dadosVeiculo.marcaModelo,
        placa: dadosVeiculo.placa
      }]);

    if (errVeiculo) {
      console.error('[ERRO SUPABASE - VEÍCULO]:', errVeiculo.message);
      res.status(400).json({ error: `Erro ao cadastrar veículo: ${errVeiculo.message}` });
      return;
    }

    res.status(201).json({
      message: 'Cadastro e upload de documentos concluídos com sucesso!',
      entregadorId: novoEntregador.id
    });
    return;

  } catch (error: any) {
    console.error('[ERRO SERVIDOR]:', error.message);
    res.status(500).json({ error: error.message || 'Erro interno do servidor.' });
    return;
  }
};

// Rotas flexíveis (aceita rotas com ou sem prefixo /api)
app.post('/cadastrar', uploadFields, processarCadastro);
app.post('/api/cadastrar', uploadFields, processarCadastro);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVIDOR OK] API rodando na porta ${PORT}`);
});