import { Router } from 'express';
import { decidirCadastro, listarPendentes } from '../controllers/admin.controller.js';
import { cadastrar, enviarCodigoRecuperacao, login, recuperarSenha, redefinirSenhaComCodigo } from '../controllers/auth.controller.js';
import { atualizarPerfil, obterPerfil, reenviarDocumentos } from '../controllers/profile.controller.js';
import { consultarCarteira, registrarCorrida, salvarChavePix, solicitarSaque } from '../controllers/wallet.controller.js';
import { aceitarEntrega, atualizarDisponibilidade, atualizarStatusEntrega, confirmarCodigo, confirmarFoto, criarEntregaTeste, listarEntregas, obterEntrega, recusarEntrega } from '../controllers/delivery.controller.js';
import { verificarToken } from '../middlewares/auth.js';
import { uploadCadastro } from '../middlewares/upload.js';
import { uploadComprovante } from '../middlewares/delivery-upload.js';

export const apiRouter = Router();

apiRouter.use((req, res, next) => {
  console.log(`[ROUTE DEBUG] Requisição recebida: ${req.method} ${req.originalUrl}`);
  next();
});

apiRouter.post('/cadastrar', uploadCadastro, cadastrar);
apiRouter.post('/login', login);
apiRouter.post('/recuperar-senha', recuperarSenha);
apiRouter.post('/recuperar-senha/enviar-codigo', enviarCodigoRecuperacao);
apiRouter.post('/recuperar-senha/confirmar', redefinirSenhaComCodigo);
apiRouter.get('/admin/cadastros-pendentes', listarPendentes);
apiRouter.post('/admin/decidir-cadastro', decidirCadastro);
apiRouter.post('/carteira/salvar-chave-pix', verificarToken, salvarChavePix);
apiRouter.get('/carteira/:usuarioId', verificarToken, consultarCarteira);
apiRouter.post('/carteira/solicitar-saque', verificarToken, solicitarSaque);
apiRouter.post('/carteira/registrar-corrida', verificarToken, registrarCorrida);
apiRouter.get('/entregas', verificarToken, listarEntregas);
apiRouter.get('/entregas/:entregaId', verificarToken, obterEntrega);
apiRouter.post('/entregas/teste', verificarToken, criarEntregaTeste);
apiRouter.patch('/entregador/status', verificarToken, atualizarDisponibilidade);
apiRouter.patch('/entregas/:entregaId/aceitar', verificarToken, aceitarEntrega);
apiRouter.patch('/entregas/:entregaId/recusar', verificarToken, recusarEntrega);
apiRouter.patch('/entregas/:entregaId/status', verificarToken, atualizarStatusEntrega);
apiRouter.post('/entregas/:entregaId/confirmar-codigo', verificarToken, confirmarCodigo);
apiRouter.post('/entregas/:entregaId/confirmar-foto', verificarToken, uploadComprovante, confirmarFoto);
apiRouter.get('/entregador/perfil', verificarToken, obterPerfil);
apiRouter.put('/entregador/perfil', verificarToken, atualizarPerfil);
apiRouter.post('/entregador/documentos', verificarToken, uploadCadastro, reenviarDocumentos);
