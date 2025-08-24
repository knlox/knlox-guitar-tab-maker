// src/services/tabService.js
import axios from 'axios';

const API_URL = "http://localhost:8080/api/tabs";

export const getTabs = () => {
  return axios.get(API_URL);
};

export const createTab = (tab) => {
  return axios.post(API_URL, tab);
};
