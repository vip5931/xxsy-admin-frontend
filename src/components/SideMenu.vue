<script setup lang="ts">
import { computed, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NMenu } from 'naive-ui';
import { usePermissionStore } from '@/stores/permission';
import type { MenuOption } from 'naive-ui';

const router = useRouter();
const route = useRoute();
const permissionStore = usePermissionStore();

const allMenuItems: MenuOption[] = [
  { label: '仪表盘', key: '/dashboard', icon: () => h('span', { innerHTML: '&#x1F4CA;' }) },
  { label: '用户管理', key: '/users', icon: () => h('span', { innerHTML: '&#x1F464;' }) },
  { label: '角色管理', key: '/roles', icon: () => h('span', { innerHTML: '&#x1F511;' }) },
  { label: '排行榜管理', key: '/ranks', icon: () => h('span', { innerHTML: '&#x1F3C6;' }) },
  { label: '门派管理', key: '/schools', icon: () => h('span', { innerHTML: '&#x1F3DB;' }) },
  { label: '区服管理', key: '/game-servers', icon: () => h('span', { innerHTML: '&#x1F310;' }) },
  { label: 'AI分析记录', key: '/ai-records', icon: () => h('span', { innerHTML: '&#x1F916;' }) },
  { label: '操作日志', key: '/audit-logs', icon: () => h('span', { innerHTML: '&#x1F4CB;' }) },
];

const menuItems = computed(() => {
  return allMenuItems.filter((item) => {
    const resolved = router.resolve(item.key as string);
    const perm = resolved.meta.permission as string | undefined;
    return !perm || permissionStore.hasPermission(perm);
  });
});

const activeKey = computed(() => route.path);

function handleMenuClick(key: string) {
  router.push(key);
}
</script>

<template>
  <n-menu
    :value="activeKey"
    :options="menuItems"
    @update:value="handleMenuClick"
    style="height: 100%"
  />
</template>
