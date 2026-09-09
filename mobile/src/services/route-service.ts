export type CoordenadaRota = { latitude: number; longitude: number };

export async function obterRotaPorEstradas(origem: CoordenadaRota, destino: CoordenadaRota): Promise<CoordenadaRota[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origem.longitude},${origem.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error('Não foi possível gerar a rota.');

  const dados = await resposta.json();
  const coordenadas = dados.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordenadas)) throw new Error('Rota indisponível.');

  return coordenadas.map(([longitude, latitude]: [number, number]) => ({ latitude, longitude }));
}
