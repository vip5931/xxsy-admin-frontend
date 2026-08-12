import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { usePermissionStore } from "@/stores/permission";
import { useAuthStore } from "@/stores/auth";

// ── hash 路由 URL 规范化 ──────────────────────────────────────────────
// 访问裸路径(如 /login,nginx try_files 会回退到 index.html)或历史遗留的
// /login#/login 双路径时,统一重定向为规范的 /#/login,避免地址栏出现双路径。
(function normalizeHashUrl() {
  const { pathname, hash } = window.location;
  if (pathname === "/" || pathname === "/index.html") return;
  const target = "/#" + (hash || pathname);
  if (window.location.pathname + window.location.hash !== target) {
    window.location.replace(target);
  }
})();

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/",
    component: () => import("@/components/AppLayout.vue"),
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: () => import("@/views/Dashboard.vue"),
        meta: { title: "仪表盘", permission: "dashboard:read" },
      },
      {
        path: "users",
        name: "Users",
        component: () => import("@/views/users/UserList.vue"),
        meta: { title: "用户管理", permission: "users:read" },
      },
      {
        path: "roles",
        name: "Roles",
        component: () => import("@/views/roles/RoleList.vue"),
        meta: { title: "角色管理", permission: "roles:read" },
      },
      {
        path: "ranks",
        name: "Ranks",
        component: () => import("@/views/rank/RankList.vue"),
        meta: { title: "排行榜管理", permission: "rank:read" },
      },
      {
        path: "schools",
        name: "Schools",
        component: () => import("@/views/school/SchoolList.vue"),
        meta: { title: "门派排行", permission: "school:read" },
      },
      {
        path: "pets",
        name: "Pets",
        component: () => import("@/views/pet/PetList.vue"),
        meta: { title: "捉宠管理", permission: "pet:read" },
      },
      {
        path: "game-servers",
        name: "GameServers",
        component: () => import("@/views/game-server/GameServerList.vue"),
        meta: { title: "区服管理", permission: "game-server:read" },
      },
      {
        path: "professions",
        name: "Professions",
        component: () => import("@/views/profession/ProfessionList.vue"),
        meta: { title: "职业管理", permission: "profession:read" },
      },
      {
        path: "announcements",
        name: "Announcements",
        component: () => import("@/views/announcement/AnnouncementList.vue"),
        meta: { title: "公告管理", permission: "announcement:read" },
      },
      {
        path: "push",
        name: "Push",
        component: () => import("@/views/push/PushManage.vue"),
        meta: { title: "推送管理", permission: "push:read" },
      },
      {
        path: "notices",
        name: "Notices",
        component: () => import("@/views/notice/NoticeList.vue"),
        meta: { title: "消息通知", permission: "notice:read" },
      },
      {
        path: "audit-logs",
        name: "AuditLogs",
        component: () => import("@/views/audit-log/AuditLogList.vue"),
        meta: { title: "操作日志", permission: "audit-log:read" },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/profile/Profile.vue"),
        meta: { title: "个人设置" },
      },
    ],
  },
  {
    path: "/403",
    name: "Forbidden",
    component: () => import("@/views/Forbidden.vue"),
    meta: { title: "无权限" },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const token = localStorage.getItem("access_token");

  if (to.path === "/login") {
    return token ? next("/dashboard") : next();
  }

  if (!token) {
    return next("/login");
  }

  const authStore = useAuthStore();
  const permissionStore = usePermissionStore();

  if (!authStore.user && token) {
    try {
      await authStore.fetchMe();
    } catch {
      authStore.logout();
      return next("/login");
    }
  }

  if (
    to.meta.permission &&
    !permissionStore.hasPermission(to.meta.permission as string)
  ) {
    return next("/403");
  }

  next();
});

export default router;
