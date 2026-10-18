import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Coordenada = { latitude: number; longitude: number };
type Props = { posicao: Coordenada; rota: Coordenada[]; mostrarDestino: boolean; tituloDestino: string };

const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;width:100%;margin:0;background:#E1E8DF}.leaflet-control-attribution{font-size:10px}</style>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head><body><div id="map"></div><script>
const map=L.map('map',{zoomControl:true,attributionControl:false}).setView([-15.793889,-47.882778],13);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(map);
L.control.attribution({position:'bottomleft'}).addTo(map);
let entregador=null,destino=null,linha=null;
window.atualizarMapa=function(d){
  const p=d.posicao;
  if(!p||!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude))return;
  if(!entregador)entregador=L.circleMarker([p.latitude,p.longitude],{radius:8,color:'#fff',weight:3,fillColor:'#1E4720',fillOpacity:1}).addTo(map).bindPopup('Sua localização');
  else entregador.setLatLng([p.latitude,p.longitude]);
  const pontos=Array.isArray(d.rota)?d.rota.filter(x=>Number.isFinite(x.latitude)&&Number.isFinite(x.longitude)):[];
  if(linha){map.removeLayer(linha);linha=null;}
  if(destino){map.removeLayer(destino);destino=null;}
  if(d.mostrarDestino&&pontos.length){const fim=pontos[pontos.length-1];destino=L.marker([fim.latitude,fim.longitude]).addTo(map).bindPopup(d.tituloDestino||'Destino da entrega');}
  if(pontos.length>1){linha=L.polyline(pontos.map(x=>[x.latitude,x.longitude]),{color:'#23A24D',weight:5}).addTo(map);map.fitBounds(linha.getBounds(),{padding:[32,32]});}
  else map.setView([p.latitude,p.longitude],15);
};
</script></body></html>`;

export function MapaOpenStreetMap({ posicao, rota, mostrarDestino, tituloDestino }: Props) {
  const webView = useRef<WebView>(null);
  const carregado = useRef(false);
  const dados = useMemo(() => ({ posicao, rota, mostrarDestino, tituloDestino }), [posicao, rota, mostrarDestino, tituloDestino]);
  const atualizar = useCallback(() => {
    if (!carregado.current) return;
    webView.current?.injectJavaScript(`window.atualizarMapa(${JSON.stringify(dados)}); true;`);
  }, [dados]);

  useEffect(() => { atualizar(); }, [atualizar]);

  return <View style={styles.container}><WebView
    ref={webView}
    source={{ html }}
    originWhitelist={['*']}
    javaScriptEnabled
    domStorageEnabled
    scrollEnabled={false}
    userAgent="RedeAgro/1.0 (aplicativo Android)"
    onLoadEnd={() => { carregado.current = true; atualizar(); }}
    onError={() => { carregado.current = false; }}
  /></View>;
}

const styles = StyleSheet.create({ container: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } });
