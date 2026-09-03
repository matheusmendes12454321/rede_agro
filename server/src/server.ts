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

// Servir arquivos estáticos do painel de testes
app.use('/teste', express.static('public'));

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('[ERRO CRÍTICO] SUPABASE_URL ou SUPABASE_KEY não configuradas no .env!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração de upload de fotos (Multer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const uploadFields = upload.fields([
  { name: 'fotoCnh', maxCount: 1 },
  { name: 'fotoDocumento', maxCount: 1 }
]);

/* ==========================================================================
   1. CADASTRO E LOGIN DE ENTREGADORES
   ========================================================================== */

const processarCadastro: RequestHandler = async (req, res) => {
  try {
    const dadosPessoais = typeof req.body.dadosPessoais === 'string' ? JSON.parse(req.body.dadosPessoais) : req.body.dadosPessoais || {};
    const dadosVeiculo = typeof req.body.dadosVeiculo === 'string' ? JSON.parse(req.body.dadosVeiculo) : req.body.dadosVeiculo || {};
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    let statusFinal = 'PENDENTE';
    let cnhValida = false;
    let docValido = false;

    if (files?.fotoCnh?.[0] && dadosPessoais.cpf) {
      const resCnh = await validarDocumentoComOCR(files.fotoCnh[0].buffer, dadosPessoais.cpf);
      cnhValida = resCnh.valido;
    }

    if (files?.fotoDocumento?.[0] && dadosVeiculo.placa) {
      const resDoc = await validarDocumentoComOCR(files.fotoDocumento[0].buffer, dadosVeiculo.placa);
      docValido = resDoc.valido;
    }

    if (cnhValida && docValido) statusFinal = 'APROVADO';

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
      res.status(400).json({ error: `Erro ao criar usuário: ${errUsuario.message}` });
      return;
    }

    if (files?.fotoCnh?.[0]) {
      const fileCnh = files.fotoCnh[0];
      const pathCnh = `cnh/${novoUsuario.id}_${Date.now()}.jpg`;
      const { data: uploadData } = await supabase.storage.from('documentos').upload(pathCnh, fileCnh.buffer, { contentType: 'image/jpeg', upsert: true });
      if (uploadData) {
        const url = supabase.storage.from('documentos').getPublicUrl(uploadData.path).data.publicUrl;
        await supabase.from('Foto').insert([{ usuario_id: novoUsuario.id, tipo_documento: 'CNH', url }]);
      }
    }

    await supabase.from('Veiculo').insert([{
      usuario_id: novoUsuario.id,
      tipo: dadosVeiculo.tipo,
      marca_modelo: dadosVeiculo.marcaModelo,
      placa: dadosVeiculo.placa
    }]);

    res.status(201).json({
      message: 'Cadastro processado com sucesso!',
      usuarioId: novoUsuario.id,
      status: statusFinal
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const processarLogin: RequestHandler = async (req, res) => {
  try {
    const { login, senha } = req.body;
    const termoLogin = String(login).trim();

    const { data: usuario, error } = await supabase
      .from('Usuario')
      .select('*, Veiculo(*), Foto(*)')
      .or(`email.eq.${termoLogin},cpf.eq.${termoLogin}`)
      .eq('senha', senha)
      .maybeSingle();

    if (error || !usuario) {
      res.status(401).json({ error: 'E-mail/CPF ou senha inválidos.' });
      return;
    }

    if (usuario.status !== 'APROVADO') {
      res.status(403).json({ error: `Sua conta está com status "${usuario.status}".` });
      return;
    }

    res.status(200).json({ message: 'Login realizado com sucesso!', usuario });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
};

/* ==========================================================================
   2. GESTÃO DA CHAVE PIX DIRETA E CARTEIRA
   ========================================================================== */

// Salvar/Atualizar a Chave Pix da conta de menor (ou do recebedor)
const salvarChavePix: RequestHandler = async (req, res) => {
  try {
    const { usuarioId, chavePix, tipoChave } = req.body;

    if (!usuarioId || !chavePix || !tipoChave) {
      res.status(400).json({ error: 'Campos usuarioId, chavePix e tipoChave são obrigatórios.' });
      return;
    }

    const { error } = await supabase
      .from('Usuario')
      .update({
        chave_pix: String(chavePix).trim(),
        tipo_chave_pix: String(tipoChave).toUpperCase().trim()
      })
      .eq('id', usuarioId);

    if (error) throw error;

    res.status(200).json({ message: 'Chave Pix cadastrada com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Obter os dados da Chave Pix para exibir na tela do cliente
const obterPixParaPagamento: RequestHandler = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const { data: usuario, error } = await supabase
      .from('Usuario')
      .select('id, nome, chave_pix, tipo_chave_pix')
      .eq('id', usuarioId)
      .single();

    if (error || !usuario?.chave_pix) {
      res.status(400).json({ error: 'Chave Pix não encontrada para este usuário.' });
      return;
    }

    res.status(200).json({
      nomeRecebedor: usuario.nome,
      chavePix: usuario.chave_pix,
      tipoChavePix: usuario.tipo_chave_pix,
      instrucao: `Faça a transferência Pix no app do seu banco usando a chave abaixo.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Registrar a corrida e atualizar o histórico
const registrarCorrida: RequestHandler = async (req, res) => {
  try {
    const { entregadorId, entregaId, valorTotal } = req.body;

    if (!entregadorId || !valorTotal) {
      res.status(400).json({ error: 'Parâmetros entregadorId e valorTotal são obrigatórios.' });
      return;
    }

    const valorFloat = parseFloat(valorTotal);
    const taxaPlataforma = parseFloat((valorFloat * 0.15).toFixed(2));
    const valorEntregador = parseFloat((valorFloat - taxaPlataforma).toFixed(2));

    const { data: transacao, error } = await supabase
      .from('Transacao')
      .insert([{
        usuario_id: entregadorId,
        entrega_id: entregaId || null,
        tipo: 'CREDITO',
        valor: valorEntregador,
        taxa_plataforma: taxaPlataforma,
        valor_total: valorFloat,
        status: 'CONCLUIDO',
        gateway_txid: `PIX_DIRETO_${Date.now()}`
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'Corrida registrada com sucesso!',
      transacao
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Consultar o extrato e saldo acumulado
const consultarCarteira: RequestHandler = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const { data: usuario } = await supabase
      .from('Usuario')
      .select('chave_pix, tipo_chave_pix')
      .eq('id', usuarioId)
      .single();

    const { data: transacoes, error } = await supabase
      .from('Transacao')
      .select('*')
      .eq('usuario_id', usuarioId);

    if (error) throw error;

    const listaOrdenada = (transacoes || []).sort((a, b) => {
      const dataA = new Date(a.criado_em || a.criada_em || 0).getTime();
      const dataB = new Date(b.criado_em || b.criada_em || 0).getTime();
      return dataB - dataA;
    });

    const saldoTotal = listaOrdenada
      .filter((t) => t.status === 'CONCLUIDO')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    res.status(200).json({
      usuarioId,
      saldo: saldoTotal.toFixed(2),
      chavePix: usuario?.chave_pix || null,
      tipoChavePix: usuario?.tipo_chave_pix || null,
      extrato: listaOrdenada
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/* ==========================================================================
   3. REGISTRO DAS ROTAS
   ========================================================================== */

app.post('/cadastrar', uploadFields, processarCadastro);
app.post('/api/cadastrar', uploadFields, processarCadastro);
app.post('/login', processarLogin);
app.post('/api/login', processarLogin);

app.post('/api/carteira/salvar-chave-pix', salvarChavePix);
app.get('/api/carteira/obter-pix/:usuarioId', obterPixParaPagamento);
app.post('/api/carteira/registrar-corrida', registrarCorrida);
app.get('/api/carteira/:usuarioId', consultarCarteira);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVIDOR OK] API rodando na porta ${PORT}`);
  console.log(`[PAINEL DE TESTES] Acesse: http://localhost:${PORT}/teste`);
});