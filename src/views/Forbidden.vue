<script setup lang="ts">
import { useRouter } from 'vue-router';
import { NButton, NIcon } from 'naive-ui';
import { ArrowBackOutline } from '@vicons/ionicons5';

const router = useRouter();
</script>

<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-code">403</div>
      <h2>没有访问权限</h2>
      <p>抱歉，您当前账号无权访问该页面，请联系管理员开通相应权限。</p>
      <n-button type="primary" @click="router.push('/dashboard')">
        <template #icon>
          <n-icon><ArrowBackOutline /></n-icon>
        </template>
        返回仪表盘
      </n-button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.error-card {
  text-align: center;
  max-width: 420px;
}

.error-code {
  font-size: 88px;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, #d03050, #fa8c16);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.error-card h2 {
  margin-top: 12px;
  font-size: 20px;
}

.error-card p {
  margin: 12px 0 24px;
  color: var(--text-2);
  line-height: 1.7;
}
</style>
