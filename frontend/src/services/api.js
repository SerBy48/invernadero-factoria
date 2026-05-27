import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const lang = localStorage.getItem('lang') || 'es';
  config.headers['Accept-Language'] = lang;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const errores = err.response?.data?.errores;
    const msg = errores
      ? Object.values(errores).join('\n')
      : err.response?.data?.error
        || err.response?.data?.mensaje
        || 'Error de conexion';
    return Promise.reject(new Error(msg));
  }
);

export default api;
