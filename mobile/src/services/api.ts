import axios from 'axios';

const SEU_IP_LOCAL = '192.168.5.21'; //colocar o ip local do pc q vai rodar o servidor

export const api = axios.create({
  baseURL: `http://${SEU_IP_LOCAL}:3000/api`,
});