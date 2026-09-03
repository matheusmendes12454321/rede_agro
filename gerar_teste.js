import { createCanvas } from 'canvas';
import fs from 'fs';

// 1. Imagem de Teste para a CNH
const canvasCnh = createCanvas(600, 400);
const ctxCnh = canvasCnh.getContext('2d');

ctxCnh.fillStyle = '#ffffff';
ctxCnh.fillRect(0, 0, 600, 400);

ctxCnh.fillStyle = '#000000';
ctxCnh.font = '28px Arial';
ctxCnh.fillText('CARTEIRA NACIONAL DE HABILITACAO', 40, 60);
ctxCnh.fillText('CPF: 123.456.789-11', 40, 150);
ctxCnh.fillText('NOME: mt', 40, 200);

fs.writeFileSync('./cnhh_teste.png', canvasCnh.toBuffer('image/png'));
console.log('✅ Imagem cnhh_teste.png gerada!');

// 2. Imagem de Teste para o Veículo
const canvasDoc = createCanvas(600, 400);
const ctxDoc = canvasDoc.getContext('2d');

ctxDoc.fillStyle = '#ffffff';
ctxDoc.fillRect(0, 0, 600, 400);

ctxDoc.fillStyle = '#000000';
ctxDoc.font = '28px Arial';
ctxDoc.fillText('DOCUMENTO DO VEICULO - CRLV', 40, 60);
ctxDoc.fillText('PLACA: ABC1D23', 40, 150);
ctxDoc.fillText('MODELO: HONDACG160', 40, 200);

fs.writeFileSync('./docc_veiculo_teste.png', canvasDoc.toBuffer('image/png'));
console.log('✅ Imagem doc_veiculo_teste.png gerada!');