<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, useMessage } from 'naive-ui';
import { createGameServerApi, updateGameServerApi, getGameServerApi } from '@/api/game-server';

const props = defineProps<{ serverId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const form = ref({ name: '', code: '', sortOrder: 0, status: 1 });
const loading = ref(false);
const isEdit = ref(false);

onMounted(async () => {
  if (props.serverId) {
    isEdit.value = true;
    const res: any = await getGameServerApi(props.serverId);
    const s = res.data;
    form.value = { name: s.name, code: s.code, sortOrder: s.sortOrder, status: s.status };
  }
});

async function handleSubmit() {
  loading.value = true;
  try {
    const data = { ...form.value };
    if (isEdit.value) {
      await updateGameServerApi(props.serverId!, data);
    } else {
      await createGameServerApi(data);
    }
    message.success(isEdit.value ? '更新成功' : '创建成功');
    emit('close');
  } catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败');
  } finally { loading.value = false; }
}
</script>

<template>
  <n-form :model="form">
    <n-form-item label="区服名" required><n-input v-model:value="form.name" /></n-form-item>
    <n-form-item v-if="!isEdit" label="编码" required><n-input v-model:value="form.code" /></n-form-item>
    <n-form-item label="排序"><n-input-number v-model:value="form.sortOrder" :min="0" style="width:100%" /></n-form-item>
    <n-form-item label="状态">
      <n-select v-model:value="form.status" :options="[{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]" />
    </n-form-item>
    <n-button type="primary" block :loading="loading" @click="handleSubmit">
      {{ isEdit ? '保存修改' : '创建区服' }}
    </n-button>
  </n-form>
</template>
