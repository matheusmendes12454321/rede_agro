import { api } from './api';

export type Entrega = { id: string; status: 'ACEITO' | 'A_CAMINHO_COLETA' | 'COLETADO' | 'A_CAMINHO_ENTREGA' | 'ENTREGUE'; endereco_origem: string; endereco_destino: string; valor: number };
export type Coordenada = { latitude: number; longitude: number };

export const deliveryService = {
  async listarAtivas(entregadorId: string): Promise<Entrega[]> {
    const response = await api.get(`/entregas/ativas/${entregadorId}`);
    return response.data.entregas ?? [];
  },
  async aceitarTeste(entregadorId: string, indice: number) {
    const response = await api.post('/entregas/teste', { entregadorId, indice });
    return response.data;
  },
  async atualizarStatus(entregaId: string, novoStatus: 'A_CAMINHO_COLETA' | 'COLETADO' | 'A_CAMINHO_ENTREGA') {
    const response = await api.patch(`/entregas/${entregaId}/status`, { novoStatus });
    return response.data.entrega as Entrega;
  },
 async concluir(entregaId: string, codigoConfirmacao?: string, foto?: { uri: string; name: string; type: string }) {
    const formData = new FormData();
    if (codigoConfirmacao) formData.append('codigo', codigoConfirmacao);
    
    if (foto) {
      formData.append('foto', {
        uri: foto.uri,
        name: foto.name,
        type: foto.type,
      } as any);
    }

const endpoint = foto ? `/entregas/${entregaId}/confirmar-foto` : `/entregas/${entregaId}/confirmar-codigo`;
    const response = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return response.data;
  },
  async gerarRota(origem: Coordenada, destino: Coordenada): Promise<{ coordenadas: Coordenada[]; distanciaMetros: number | null; duracaoSegundos: number | null }> {
    const response = await api.post('/rotas/gerar', { origem, destino });
    return response.data;
  },
};