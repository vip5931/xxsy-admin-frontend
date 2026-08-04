<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NCard,
  NIcon,
  useMessage,
} from 'naive-ui';
import { PersonOutline, LockClosedOutline, GameControllerOutline } from '@vicons/ionicons5';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const message = useMessage();

const form = ref({ username: '', password: '' });
const loading = ref(false);

async function handleLogin() {
  if (!form.value.username.trim()) {
    message.warning('请输入用户名');
    return;
  }
  if (!form.value.password) {
    message.warning('请输入密码');
    return;
  }

  loading.value = true;
  try {
    await authStore.login(form.value.username, form.value.password);
    await authStore.fetchMe();
    message.success('登录成功');
    router.push('/dashboard');
  } catch (e: any) {
    message.error(e?.response?.data?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-left">
      <div class="login-brand">
        <div class="login-brand-logo">
          <n-icon :size="20"><GameControllerOutline /></n-icon>
        </div>
        <span class="login-brand-text">xxsy 管理平台</span>
      </div>

      <h1>游戏后台管理系统</h1>
      <p class="login-lead">
        集用户、角色、权限、战力排行与门派排行数据管理于一体，为企业提供安全、高效的一站式后台解决方案。
      </p>

      <ul class="login-features">
        <li><span class="feature-dot" />细粒度 RBAC 权限控制</li>
        <li><span class="feature-dot" />AI 图片识别，批量录入战力排行与门派排行数据</li>
        <li><span class="feature-dot" />全链路操作审计与安全日志</li>
      </ul>

      <div class="login-footer">© 2026 xxsy 管理平台 · 企业级后台系统</div>
    </div>

    <div class="login-right">
      <n-card class="login-card" :bordered="false">
        <h2>欢迎回来</h2>
        <p class="login-sub">登录您的管理账号，继续高效工作</p>

        <n-form :model="form" @keyup.enter="handleLogin">
          <n-form-item label="用户名">
            <n-input
              v-model:value="form.username"
              size="large"
              placeholder="请输入用户名"
              clearable
            >
              <template #prefix>
                <n-icon :size="16"><PersonOutline /></n-icon>
              </template>
            </n-input>
          </n-form-item>
          <n-form-item label="密码">
            <n-input
              v-model:value="form.password"
              type="password"
              size="large"
              placeholder="请输入密码"
              show-password-on="click"
            >
              <template #prefix>
                <n-icon :size="16"><LockClosedOutline /></n-icon>
              </template>
            </n-input>
          </n-form-item>

          <n-button
            type="primary"
            size="large"
            block
            :loading="loading"
            style="margin-top: 8px"
            @click="handleLogin"
          >
            登 录
          </n-button>
        </n-form>
      </n-card>
    </div>
  </div>
</template>
