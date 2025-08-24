// src/services/tabService.js
import axios from 'axios';

const API_URL = "http://localhost:8080/api/tabs";

export const getTabs = () => {
  return axios.get(API_URL);
};

export const createTab = (tab) => {
  return axios.post(API_URL, tab);
};

export const getTabById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

export const updateTab = (id, tab) => {
  return axios.put(`${API_URL}/${id}`, tab);
};

export const deleteTab = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};
