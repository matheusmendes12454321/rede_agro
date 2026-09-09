import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';

export type Coordenadas = { latitude: number; longitude: number };

export function useLocalizacao() {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [gpsDesligado, setGpsDesligado] = useState(false);
  const [permissaoNegada, setPermissaoNegada] = useState(false);
  const atualizar = useCallback(async () => {
    setErro(null);
    const permissao = await Location.requestForegroundPermissionsAsync();
    if (!permissao.granted) { setPermissaoNegada(true); return; }
    setPermissaoNegada(false);
    if (!(await Location.hasServicesEnabledAsync())) { setGpsDesligado(true); return; }
    setGpsDesligado(false);
    try {
      const atual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoordenadas({ latitude: atual.coords.latitude, longitude: atual.coords.longitude });
    } catch { setErro('Não foi possível obter sua localização. Verifique o GPS e tente novamente.'); }
  }, []);
  useEffect(() => { let inscricao: Location.LocationSubscription | undefined; void (async () => { await atualizar(); const permissao = await Location.getForegroundPermissionsAsync(); if (permissao.granted && await Location.hasServicesEnabledAsync()) inscricao = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 10 }, posicao => setCoordenadas({ latitude: posicao.coords.latitude, longitude: posicao.coords.longitude })); })(); return () => inscricao?.remove(); }, [atualizar]);
  return { coordenadas, erro, gpsDesligado, permissaoNegada, atualizar };
}
