<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { NForm, NFormItem, NInput, NButton, NCard, NMessageProvider, useMessage } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const message = useMessage();

const form = ref({ username: '', password: '' });
const loading = ref(false);

async function handleLogin() {
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
  <n-message-provider>
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f0f2f5">
      <n-card title="xxsy-admin 后台管理系统" style="width: 400px">
        <n-form :model="form">
          <n-form-item label="用户名">
            <n-input v-model:value="form.username" placeholder="请输入用户名" />
          </n-form-item>
          <n-form-item label="密码">
            <n-input v-model:value="form.password" type="password" placeholder="请输入密码" />
          </n-form-item>
          <n-button type="primary" block :loading="loading" @click="handleLogin">
            登 录
          </n-button>
        </n-form>
      </n-card>
    </div>
  </n-message-provider>
</template>
