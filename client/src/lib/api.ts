import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000', // TODO: Use env variable
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getIpoList = async () => {
  const response = await api.get('/ipo');
  return response.data;
};
