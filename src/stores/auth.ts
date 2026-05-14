import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginApi, refreshApi, getMeApi, changePasswordApi } from '@/api/auth';

interface UserInfo {
  id: number;
  username: string;
  realName: string;
  email: string;
  roles: { id: number; name: string; code: string }[];
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('access_token') || '');
  const refreshToken = ref(localStorage.getItem('refresh_token') || '');
  const user = ref<UserInfo | null>(null);

  const isLoggedIn = computed(() => !!token.value);

  function setTokens(accessToken: string, rt: string) {
    token.value = accessToken;
    refreshToken.value = rt;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', rt);
  }

  async function login(username: string, password: string) {
    const res: any = await loginApi({ username, password });
    setTokens(res.data.access_token, res.data.refresh_token);
    user.value = res.data.user;
  }

  async function fetchMe() {
    const res: any = await getMeApi();
    user.value = res.data;
    const { usePermissionStore } = await import('@/stores/permission');
    const permStore = usePermissionStore();
    permStore.setPermissions(res.data.permissions || []);
    return res.data;
  }

  async function refresh() {
    try {
      const res: any = await refreshApi(refreshToken.value);
      setTokens(res.data.access_token, res.data.refresh_token);
      return true;
    } catch {
      logout();
      return false;
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    await changePasswordApi({ oldPassword, newPassword });
  }

  function logout() {
    token.value = '';
    refreshToken.value = '';
    user.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  return { token, refreshToken, user, isLoggedIn, login, fetchMe, refresh, changePassword, logout, setTokens };
});
