import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadCadastro = upload.fields([
  { name: 'fotoCnh', maxCount: 1 },
  { name: 'fotoDocumento', maxCount: 1 },
  { name: 'fotoPerfil', maxCount: 1 },
]);
