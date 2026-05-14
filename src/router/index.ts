import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { usePermissionStore } from '@/stores/permission';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', permission: 'dashboard:read' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserList.vue'),
        meta: { title: '用户管理', permission: 'users:read' },
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/roles/RoleList.vue'),
        meta: { title: '角色管理', permission: 'roles:read' },
      },
      {
        path: 'ranks',
        name: 'Ranks',
        component: () => import('@/views/rank/RankList.vue'),
        meta: { title: '排行榜管理', permission: 'rank:read' },
      },
      {
        path: 'schools',
        name: 'Schools',
        component: () => import('@/views/school/SchoolList.vue'),
        meta: { title: '学校管理', permission: 'school:read' },
      },
      {
        path: 'ai-records',
        name: 'AiRecords',
        component: () => import('@/views/ai-record/AiRecordList.vue'),
        meta: { title: 'AI分析记录', permission: 'ai-record:read' },
      },
      {
        path: 'audit-logs',
        name: 'AuditLogs',
        component: () => import('@/views/audit-log/AuditLogList.vue'),
        meta: { title: '操作日志', permission: 'audit-log:read' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/Profile.vue'),
        meta: { title: '个人设置' },
      },
    ],
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/Forbidden.vue'),
    meta: { title: '无权限' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('access_token');

  if (to.path === '/login') {
    return token ? next('/dashboard') : next();
  }

  if (!token) {
    return next('/login');
  }

  const permissionStore = usePermissionStore();
  if (to.meta.permission && !permissionStore.hasPermission(to.meta.permission as string)) {
    return next('/403');
  }

  next();
});

export default router;
