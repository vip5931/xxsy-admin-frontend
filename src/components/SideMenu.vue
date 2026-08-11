<script setup lang="ts">
import { computed, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NMenu, NIcon } from 'naive-ui';
import type { Component } from 'vue';
import type { MenuOption } from 'naive-ui';
import {
  SpeedometerOutline,
  PeopleOutline,
  KeyOutline,
  TrophyOutline,
  SchoolOutline,
  PawOutline,
  ServerOutline,
  BriefcaseOutline,
  DocumentTextOutline,
  MegaphoneOutline,
} from '@vicons/ionicons5';
import { usePermissionStore } from '@/stores/permission';

const props = defineProps<{ collapsed: boolean }>();

const router = useRouter();
const route = useRoute();
const permissionStore = usePermissionStore();

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

interface MenuItemDef {
  label: string;
  key: string;
  icon: Component;
}

const groupDefs: {
  label: string;
  key: string;
  items: MenuItemDef[];
}[] = [
  {
    label: '总览',
    key: 'overview',
    items: [
      { label: '仪表盘', key: '/dashboard', icon: SpeedometerOutline },
    ],
  },
  {
    label: '业务管理',
    key: 'biz',
    items: [
      { label: '用户管理', key: '/users', icon: PeopleOutline },
      { label: '角色管理', key: '/roles', icon: KeyOutline },
      { label: '战力排行', key: '/ranks', icon: TrophyOutline },
      { label: '门派排行', key: '/schools', icon: SchoolOutline },
      { label: '捉宠管理', key: '/pets', icon: PawOutline },
    ],
  },
  {
    label: '基础配置',
    key: 'base',
    items: [
      { label: '区服管理', key: '/game-servers', icon: ServerOutline },
      { label: '职业管理', key: '/professions', icon: BriefcaseOutline },
      { label: '公告管理', key: '/announcements', icon: MegaphoneOutline },
    ],
  },
  {
    label: '系统审计',
    key: 'system',
    items: [
      { label: '操作日志', key: '/audit-logs', icon: DocumentTextOutline },
    ],
  },
];

const menuOptions = computed<MenuOption[]>(() => {
  const options: MenuOption[] = [];
  for (const group of groupDefs) {
    const children = group.items
      .filter((item) => {
        const resolved = router.resolve(item.key);
        const perm = resolved.meta.permission as string | undefined;
        return !perm || permissionStore.hasPermission(perm);
      })
      .map((item) => ({
        label: item.label,
        key: item.key,
        icon: renderIcon(item.icon),
      }));

    if (props.collapsed) {
      // 折叠时拍平为纯图标列表，避免分组标题在窄宽度下显示错乱
      options.push(...children);
    } else if (children.length) {
      options.push({
        type: 'group',
        label: group.label,
        key: group.key,
        children,
      } as MenuOption);
    }
  }
  return options;
});

const activeKey = computed(() => route.path);

function handleMenuClick(key: string) {
  router.push(key);
}
</script>

<template>
  <n-menu
    :value="activeKey"
    :options="menuOptions"
    :collapsed="props.collapsed"
    :collapsed-width="64"
    :collapsed-icon-size="20"
    :indent="20"
    inverted
    @update:value="handleMenuClick"
  />
</template>
