import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../api/client';
import type { User } from '../types';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('sunpower_token'));
  
  const savedUser = localStorage.getItem('sunpower_user');
  const user = ref<User | null>(savedUser ? JSON.parse(savedUser) : null);

  const isAuthenticated = computed(() => !!token.value);

  const login = async (username: string, password: string = 'password123') => {
    const res = await api.post('/auth/login', { username, password });
    const data = res.data;
    const userData: User = {
      id: data.id,
      username: data.username,
      fullName: data.fullName,
      email: data.email,
      roles: data.roles,
    };
    token.value = data.token;
    user.value = userData;
    localStorage.setItem('sunpower_token', data.token);
    localStorage.setItem('sunpower_user', JSON.stringify(userData));
  };

  const logout = () => {
    user.value = null;
    token.value = null;
    localStorage.removeItem('sunpower_token');
    localStorage.removeItem('sunpower_user');
  };

  const switchRole = async (username: string) => {
    await login(username, 'password123');
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    switchRole,
  };
});
