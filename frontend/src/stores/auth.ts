import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../api/client';
import type { User } from '../types';

export const useAuthStore = defineStore('auth', () => {
  let initialToken = localStorage.getItem('sunpower_token');
  let parsedUser: User | null = null;
  
  try {
    const savedUser = localStorage.getItem('sunpower_user');
    if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      parsedUser = JSON.parse(savedUser);
    }
  } catch (_e) {
    initialToken = null;
    parsedUser = null;
    localStorage.removeItem('sunpower_user');
    localStorage.removeItem('sunpower_token');
  }

  // Ensure both token and user object are present and valid; clear orphaned state
  if (!initialToken || !parsedUser || !parsedUser.roles || !parsedUser.roles.length) {
    initialToken = null;
    parsedUser = null;
    localStorage.removeItem('sunpower_token');
    localStorage.removeItem('sunpower_user');
  }

  const token = ref<string | null>(initialToken);
  const user = ref<User | null>(parsedUser);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

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
