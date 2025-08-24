import axios from 'axios';

const API = 'http://localhost:8080/api/users';

export const getUserByEmail = (email) => axios.get(API, { params: { email } });
export const createOrUpdateUser = (user) => axios.post(API, user);
export const deleteUser = (id) => axios.delete(`${API}/${id}`);
export const register = (user) => axios.post(`${API.replace('/users','/auth/register')}`, user);
export const login = (creds) => axios.post(`${API.replace('/users','/auth/login')}`, creds);
