import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MapaOpenStreetMap } from './MapaOpenStreetMap';

export type CoordenadaMapa = { latitude: number; longitude: number };
type Props = { posicao: CoordenadaMapa; rota: CoordenadaMapa[]; mostrarDestino: boolean; tituloDestino?: string };

export function MapaNativo({ posicao, rota, mostrarDestino, tituloDestino = 'Destino da entrega' }: Props) {
  if (Platform.OS === 'android') {
    return <MapaOpenStreetMap posicao={posicao} rota={rota} mostrarDestino={mostrarDestino} tituloDestino={tituloDestino} />;
  }

  return <MapaApple posicao={posicao} rota={rota} mostrarDestino={mostrarDestino} tituloDestino={tituloDestino} />;
}

function MapaApple({ posicao, rota, mostrarDestino, tituloDestino }: Props) {
  const mapa = useRef<MapView>(null);
  const coordenadasValidas = useMemo(() => rota.filter(({ latitude, longitude }) => Number.isFinite(latitude) && Number.isFinite(longitude)), [rota]);

  useEffect(() => {
    const pontos = coordenadasValidas.length > 1 ? coordenadasValidas : [posicao];
    mapa.current?.fitToCoordinates(pontos, { edgePadding: { top: 80, right: 50, bottom: 80, left: 50 }, animated: true });
  }, [posicao, coordenadasValidas]);

  return <View style={styles.container}><MapView ref={mapa} style={StyleSheet.absoluteFill} initialRegion={{ ...posicao, latitudeDelta: 0.04, longitudeDelta: 0.04 }} showsUserLocation showsMyLocationButton={false}>
    {mostrarDestino && coordenadasValidas.length > 0 && <Marker coordinate={coordenadasValidas[coordenadasValidas.length - 1]} title={tituloDestino} pinColor="#F05A28" />}
    {coordenadasValidas.length > 1 && <Polyline coordinates={coordenadasValidas} strokeColor="#23A24D" strokeWidth={5} />}
  </MapView></View>;
}
const styles = StyleSheet.create({ container: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } });
