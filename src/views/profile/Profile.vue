<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NCard,
  NAvatar,
  NTag,
  NSpace,
  useMessage,
} from 'naive-ui';
import { useAuthStore } from '@/stores/auth';
import PageHeader from '@/components/PageHeader.vue';

const authStore = useAuthStore();
const message = useMessage();
const form = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });
const loading = ref(false);

const userName = computed(
  () => authStore.user?.realName || authStore.user?.username || '',
);
const avatarText = computed(() => (userName.value[0] || 'A').toUpperCase());
const roleNames = computed(
  () => authStore.user?.roles?.map((r) => r.name).join('、') || '-',
);

async function handleSubmit() {
  if (!form.value.oldPassword) {
    message.warning('请输入原密码');
    return;
  }
  if (form.value.newPassword !== form.value.confirmPassword) {
    message.error('两次密码不一致');
    return;
  }
  loading.value = true;
  try {
    await authStore.changePassword(form.value.oldPassword, form.value.newPassword);
    message.success('密码修改成功');
    form.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (e: any) {
    message.error(e?.response?.data?.message || '修改失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="max-width: 760px">
    <n-card class="page-card" :bordered="false">
      <PageHeader title="个人设置" description="查看当前账号信息并修改登录密码" />

      <div class="profile-info">
        <n-avatar round size="large" class="user-avatar" style="font-size: 20px">
          {{ avatarText }}
        </n-avatar>
        <div>
          <div class="profile-name">{{ userName || '-' }}</div>
          <div class="profile-meta">
            <span>{{ authStore.user?.username || '-' }}</span>
            <n-tag size="small" type="info" :bordered="false">{{ roleNames }}</n-tag>
          </div>
        </div>
      </div>

      <n-form :model="form" label-placement="left" label-width="100" style="max-width: 480px">
        <n-form-item label="原密码">
          <n-input
            v-model:value="form.oldPassword"
            type="password"
            show-password-on="click"
            placeholder="请输入原密码"
          />
        </n-form-item>
        <n-form-item label="新密码">
          <n-input
            v-model:value="form.newPassword"
            type="password"
            show-password-on="click"
            placeholder="请输入新密码"
          />
        </n-form-item>
        <n-form-item label="确认新密码">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            show-password-on="click"
            placeholder="请再次输入新密码"
          />
        </n-form-item>
        <n-form-item label=" ">
          <n-space>
            <n-button type="primary" :loading="loading" @click="handleSubmit">
              修改密码
            </n-button>
          </n-space>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped>
.profile-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  margin-bottom: 24px;
  border-radius: 10px;
  background: linear-gradient(120deg, rgba(22, 119, 255, 0.06), rgba(54, 207, 201, 0.06));
  border: 1px solid rgba(22, 119, 255, 0.12);
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
  color: var(--text-2);
  font-size: 13px;
}
</style>
