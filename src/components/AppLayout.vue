<script setup lang="ts">
import { computed, h, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NButton,
  NSpace,
  NAvatar,
  NDropdown,
  NBreadcrumb,
  NBreadcrumbItem,
  NIcon,
  NTag,
  NTooltip,
} from 'naive-ui';
import {
  MenuOutline,
  GameControllerOutline,
  PersonCircleOutline,
  LogOutOutline,
  ExpandOutline,
} from '@vicons/ionicons5';
import { useAuthStore } from '@/stores/auth';
import SideMenu from './SideMenu.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const collapsed = ref(false);

const userName = computed(
  () => authStore.user?.realName || authStore.user?.username || '',
);
const avatarText = computed(() => (userName.value[0] || 'A').toUpperCase());
const roleNames = computed(
  () => authStore.user?.roles?.map((r) => r.name).join('、') || '',
);

const breadcrumbs = computed(() =>
  route.matched
    .filter((item) => item.meta?.title)
    .map((item) => ({ title: item.meta.title as string, path: item.path })),
);

const dropdownOptions = [
  {
    label: '个人设置',
    key: 'profile',
    icon: () => h(NIcon, null, { default: () => h(PersonCircleOutline) }),
  },
  { type: 'divider', key: 'divider-1' },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogOutOutline) }),
  },
];

function handleSelect(key: string) {
  if (key === 'logout') {
    authStore.logout();
    router.push('/login');
  } else if (key === 'profile') {
    router.push('/profile');
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}
</script>

<template>
  <n-layout has-sider style="height: 100vh">
    <n-layout-sider
      bordered
      :width="220"
      :collapsed-width="64"
      :collapsed="collapsed"
      :show-trigger="false"
      collapse-mode="width"
      :native-scrollbar="false"
      style="height: 100%"
    >
      <div class="brand">
        <div class="brand-logo">
          <n-icon :size="18"><GameControllerOutline /></n-icon>
        </div>
        <span v-if="!collapsed" class="brand-title">xxsy 管理平台</span>
      </div>
      <SideMenu :collapsed="collapsed" />
    </n-layout-sider>

    <n-layout>
      <n-layout-header bordered class="app-header">
        <n-space align="center" :size="12">
          <n-button quaternary circle size="small" @click="collapsed = !collapsed">
            <template #icon>
              <n-icon><MenuOutline /></n-icon>
            </template>
          </n-button>
          <n-breadcrumb>
            <n-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.title }}
            </n-breadcrumb-item>
          </n-breadcrumb>
        </n-space>

        <n-space align="center" :size="14">
          <n-tooltip>
            <template #trigger>
              <n-button quaternary circle size="small" @click="toggleFullscreen">
                <template #icon>
                  <n-icon><ExpandOutline /></n-icon>
                </template>
              </n-button>
            </template>
            全屏
          </n-tooltip>
          <n-tag v-if="roleNames" size="small" type="info" :bordered="false" round>
            {{ roleNames }}
          </n-tag>
          <n-dropdown :options="dropdownOptions" @select="handleSelect">
            <div class="user-trigger">
              <n-avatar round size="small" class="user-avatar">{{ avatarText }}</n-avatar>
              <span class="user-name">{{ userName || '未登录' }}</span>
            </div>
          </n-dropdown>
        </n-space>
      </n-layout-header>

      <n-layout-content class="app-content" :native-scrollbar="false">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
