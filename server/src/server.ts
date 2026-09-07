import express from 'express';
import cors from 'cors';
import { cadastrar, login } from './controllers/auth.controller.js';
import { uploadCadastro } from './middlewares/upload.js';
import { apiRouter } from './routes/index.js';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use('/teste', express.static('public'));

// Rotas legadas são mantidas para não quebrar clientes já instalados.
app.use('/api', apiRouter);
app.post('/cadastrar', uploadCadastro, cadastrar);
app.post('/login', login);

app.listen(port, '0.0.0.0', () => {
  console.log(`[SERVIDOR OK] API rodando na porta ${port}`);
  console.log(`[PAINEL DE TESTES] Acesse: http://localhost:${port}/teste`);
});
