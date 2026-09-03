  import axios from 'axios';
  import { Platform } from 'react-native';

  // Substitua pelo IP IPv4 atual do seu computador (confirme no terminal com "ipconfig")
  const IP_COMPUTADOR = '192.168.5.21'; 

  const BASE_URL = Platform.OS === 'web'
    ? 'http://localhost:3000/api'
    : `http://${IP_COMPUTADOR}:3000/api`;

  export const api = axios.create({
    baseURL: BASE_URL,
  });