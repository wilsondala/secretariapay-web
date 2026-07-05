import api from './api.js';
export async function login({email,password}){const {data}=await api.post('/api/v1/auth/login',{email,password});const token=data?.token||data?.accessToken||data?.access_token;const user=data?.user||{email:data?.email,role:data?.role,status:data?.status};if(!token) throw new Error('Token não retornado pela API.');return {token,user};}
export function persistSession(s){localStorage.setItem('secretariapay.token',s.token);localStorage.setItem('secretariapay.user',JSON.stringify(s.user||{}));}
export function getStoredSession(){let user=null;try{user=JSON.parse(localStorage.getItem('secretariapay.user')||'null')}catch{}return {token:localStorage.getItem('secretariapay.token'),user};}
export function clearSession(){localStorage.removeItem('secretariapay.token');localStorage.removeItem('secretariapay.user');}
