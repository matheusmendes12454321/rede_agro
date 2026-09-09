import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

export type TokenPayload = { usuarioId: string; tipo: string };

declare global {
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

function segredoJwt() {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) throw new Error('JWT_SECRET não está configurado no servidor.');
  return segredo;
}

export const verificarToken: RequestHandler = (req, res, next) => {
  const authorization = req.header('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: 'Sessão ausente. Entre novamente.' });
    return;
  }

  try {
    const payload = jwt.verify(token, segredoJwt());
    if (typeof payload === 'string' || !payload.usuarioId || !payload.tipo) throw new Error('Token inválido.');
    req.auth = { usuarioId: String(payload.usuarioId), tipo: String(payload.tipo) };
    next();
  } catch {
    res.status(401).json({ error: 'Sessão inválida ou expirada. Entre novamente.' });
  }
};

export function exigirUsuarioDaSessao(usuarioId: unknown, auth: TokenPayload | undefined) {
  return Boolean(auth && typeof usuarioId === 'string' && usuarioId === auth.usuarioId);
}
