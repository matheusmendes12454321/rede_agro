export type TipoChavePix = 'CPF' | 'CNPJ' | 'CELULAR' | 'EMAIL' | 'EVP';

function todosIguais(valor: string) { return /^(\d)\1+$/.test(valor); }
function validarDocumento(valor: string, pesos: number[]) {
  const digitos = valor.replace(/\D/g, '');
  const base = digitos.slice(0, -2);
  const calcular = (texto: string, lista: number[]) => {
    const soma = texto.split('').reduce((total, digito, indice) => total + Number(digito) * lista[indice], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return Number(digitos.at(-2)) === calcular(base, pesos) && Number(digitos.at(-1)) === calcular(`${base}${digitos.at(-2)}`, [6, ...pesos]);
}
export function validarCpf(chave: string) {
  const valor = chave.replace(/\D/g, '');
  if (valor.length !== 11 || todosIguais(valor)) return false;
  const calcular = (texto: string, pesoInicial: number) => {
    const soma = texto.split('').reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const primeiro = calcular(valor.slice(0, 9), 10);
  const segundo = calcular(`${valor.slice(0, 9)}${primeiro}`, 11);
  return Number(valor[9]) === primeiro && Number(valor[10]) === segundo;
}
export function validarCnpj(chave: string) { const valor = chave.replace(/\D/g, ''); return valor.length === 14 && !todosIguais(valor) && validarDocumento(valor, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]); }
export function normalizarChavePix(chave: string, tipo: TipoChavePix) {
  if (tipo === 'CPF' || tipo === 'CNPJ') return chave.replace(/\D/g, '');
  if (tipo === 'CELULAR') { const numero = chave.replace(/\D/g, ''); return `+${numero.startsWith('55') ? numero : `55${numero}`}`; }
  return chave.trim().toLowerCase();
}
export function validarChavePix(chave: string, tipo: TipoChavePix) {
  const normalizada = normalizarChavePix(chave, tipo);
  if (tipo === 'CPF') return validarCpf(normalizada);
  if (tipo === 'CNPJ') return validarCnpj(normalizada);
  if (tipo === 'CELULAR') return /^\+55\d{2}9?\d{8}$/.test(normalizada);
  if (tipo === 'EMAIL') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizada);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalizada);
}
