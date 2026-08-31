import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// ROTA DE LOGIN (Acessível em: POST http://192.168.3.178:3000/api/login)
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const { data: entregador, error } = await supabase
      .from('entregadores')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .single();

    if (error || !entregador) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos' });
    }

    return res.json({ message: 'Login realizado com sucesso', entregador });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ROTA DE CADASTRO (Acessível em: POST http://192.168.3.178:3000/api/cadastrar)
app.post('/api/cadastrar', async (req, res) => {
  const { dadosPessoais, dadosVeiculo } = req.body;

  if (!dadosPessoais || !dadosVeiculo) {
    return res.status(400).json({ 
      error: 'Dados incompletos. Envie os objetos dadosPessoais e dadosVeiculo.' 
    });
  }

  try {
    // 1. Insere o Entregador na tabela 'entregadores'
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
      console.error('Erro no Supabase (Entregadores):', errEntregador.message);
      return res.status(400).json({ error: `Erro no entregador: ${errEntregador.message}` });
    }

    // 2. Insere o Veículo na tabela 'veiculos' vinculado ao Entregador
    const { error: errVeiculo } = await supabase
      .from('veiculos')
      .insert([{
        entregador_id: novoEntregador.id,
        tipo: dadosVeiculo.tipo,
        marca_modelo: dadosVeiculo.marcaModelo,
        placa: dadosVeiculo.placa
      }]);

    if (errVeiculo) {
      console.error('Erro no Supabase (Veículos):', errVeiculo.message);
      return res.status(400).json({ error: `Erro no veículo: ${errVeiculo.message}` });
    }

    return res.status(201).json({ 
      message: 'Cadastro realizado com sucesso!', 
      entregadorId: novoEntregador.id 
    });

  } catch (error: any) {
    console.error('Erro geral no servidor:', error.message);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});