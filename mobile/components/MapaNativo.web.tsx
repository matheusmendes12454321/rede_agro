import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { CoordenadaMapa } from './MapaNativo';

type Props = { posicao: CoordenadaMapa; rota: CoordenadaMapa[]; mostrarDestino: boolean; tituloDestino?: string };
export function MapaNativo(_: Props) {
  return <View style={styles.map}><MaterialCommunityIcons name="map-outline" size={58} color="#1E4720" /><Text style={styles.text}>O mapa com GPS está disponível no aplicativo Android/iOS.</Text></View>;
}
const styles = StyleSheet.create({ map: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, justifyContent: 'center', alignItems: 'center', padding: 30 }, text: { textAlign: 'center', marginTop: 12, color: '#456' } });
