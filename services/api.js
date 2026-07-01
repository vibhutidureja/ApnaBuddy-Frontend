import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Dynamically route the request based on where the app is running
const BASE_URL = Platform.OS === 'web' 
  ? '/api' 
  : 'http://13.60.68.144:8084/api'; // Hosted on AWS EC2

export const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});