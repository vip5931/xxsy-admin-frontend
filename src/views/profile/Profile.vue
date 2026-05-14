<script setup lang="ts">
import { ref } from 'vue';
import { NForm, NFormItem, NInput, NButton, NCard, useMessage } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const message = useMessage();
const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const loading = ref(false);

async function handleSubmit() {
  if (form.value.newPassword !== form.value.confirmPassword) {
    message.error('两次密码不一致');
    return;
  }
  loading.value = true;
  try {
    await authStore.changePassword(form.value.oldPassword, form.value.newPassword);
    message.success('密码修改成功');
    form.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (e: any) { message.error(e?.response?.data?.message || '修改失败'); }
  finally { loading.value = false; }
}
</script>

<template>
  <div style="max-width: 480px">
    <h2 style="margin-bottom: 16px">个人设置</h2>
    <n-card>
      <n-form :model="form">
        <n-form-item label="当前用户">{{ authStore.user?.username || '-' }}</n-form-item>
        <n-form-item label="原密码"><n-input v-model:value="form.oldPassword" type="password" /></n-form-item>
        <n-form-item label="新密码"><n-input v-model:value="form.newPassword" type="password" /></n-form-item>
        <n-form-item label="确认新密码"><n-input v-model:value="form.confirmPassword" type="password" /></n-form-item>
        <n-button type="primary" :loading="loading" @click="handleSubmit">修改密码</n-button>
      </n-form>
    </n-card>
  </div>
</template>
