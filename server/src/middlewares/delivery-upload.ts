import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

// Usar any() aceita qualquer nome de campo enviado pelo FormData (como 'foto' ou 'fotoComprovante')
export const uploadComprovante = upload.any();