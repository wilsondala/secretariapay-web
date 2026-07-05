import axios from 'axios';import { env } from '../config/env.js';
const api=axios.create({baseURL:env.apiBaseUrl,timeout:30000,headers:{'Content-Type':'application/json',Accept:'application/json'}});
api.interceptors.request.use((config)=>{const token=localStorage.getItem('secretariapay.token'); if(token) config.headers.Authorization=`Bearer ${token}`; return config;});
api.interceptors.response.use((r)=>r,(error)=>{if(error?.response?.status===401){localStorage.removeItem('secretariapay.token');localStorage.removeItem('secretariapay.user');window.dispatchEvent(new Event('secretariapay:logout'));}return Promise.reject(error);});
export default api;
