<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { NLayout, NLayoutHeader, NLayoutSider, NLayoutContent, NButton, NSpace, NAvatar, NDropdown } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';
import SideMenu from './SideMenu.vue';

const router = useRouter();
const authStore = useAuthStore();

const userName = computed(() => authStore.user?.realName || authStore.user?.username || '');

const dropdownOptions = [
  { label: '个人设置', key: 'profile' },
  { label: '退出登录', key: 'logout' },
];

function handleSelect(key: string) {
  if (key === 'logout') {
    authStore.logout();
    router.push('/login');
  } else if (key === 'profile') {
    router.push('/profile');
  }
}
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-header bordered style="height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px">
      <span style="font-size: 18px; font-weight: 600">xxsy-admin 后台管理</span>
      <n-dropdown :options="dropdownOptions" @select="handleSelect">
        <n-space align="center" style="cursor: pointer">
          <n-avatar size="small">{{ userName[0] }}</n-avatar>
          <span>{{ userName }}</span>
        </n-space>
      </n-dropdown>
    </n-layout-header>
    <n-layout has-sider>
      <n-layout-sider bordered width="220">
        <SideMenu />
      </n-layout-sider>
      <n-layout-content style="padding: 24px; background: #f5f7fa">
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
