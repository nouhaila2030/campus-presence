import { Platform } from 'react-native';

export const API_BASE = Platform.OS === 'web'
  ? 'http://localhost:8080/api'
  : 'http://10.92.93.120:8080/api';
