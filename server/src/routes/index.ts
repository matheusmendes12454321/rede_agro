import { Router } from 'express';
import { decidirCadastro, listarPendentes } from '../controllers/admin.controller.js';
import { cadastrar, login, recuperarSenha } from '../controllers/auth.controller.js';
import { consultarCarteira, obterPixParaPagamento, registrarCorrida, salvarChavePix } from '../controllers/wallet.controller.js';
import { uploadCadastro } from '../middlewares/upload.js';

export const apiRouter = Router();

apiRouter.post('/cadastrar', uploadCadastro, cadastrar);
apiRouter.post('/login', login);
apiRouter.post('/recuperar-senha', recuperarSenha);

apiRouter.get('/admin/cadastros-pendentes', listarPendentes);
apiRouter.post('/admin/decidir-cadastro', decidirCadastro);

apiRouter.post('/carteira/salvar-chave-pix', salvarChavePix);
apiRouter.get('/carteira/obter-pix/:usuarioId', obterPixParaPagamento);
apiRouter.post('/carteira/registrar-corrida', registrarCorrida);
apiRouter.get('/carteira/:usuarioId', consultarCarteira);
