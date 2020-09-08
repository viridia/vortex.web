import axios from 'axios';

export const API_HOST = process.env.REACT_APP_API_HOST || '';
export const AUTH_HOST = process.env.REACT_APP_AUTH_HOST || '';

export const axiosInstance = axios.create({
  baseURL: API_HOST
});
