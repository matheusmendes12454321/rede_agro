import Tesseract from 'tesseract.js';

function limparTexto(texto: string): string {
  return texto.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export async function validarDocumentoComOCR(
  imageBuffer: Buffer,
  termoEsperado: string
): Promise<{ valido: boolean; textoEncontrado: string }> {
  try {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'por');

    const textoFormatado = limparTexto(text);
    const termoFormatado = limparTexto(termoEsperado);

    const valido = textoFormatado.includes(termoFormatado);

    return { valido, textoEncontrado: text };
  } catch (error) {
    console.error('[ERRO OCR]:', error);
    return { valido: false, textoEncontrado: '' };
  }
}