<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, useMessage } from 'naive-ui';
import { createSchoolApi, updateSchoolApi, getSchoolApi } from '@/api/school';
import { getAllGameServersApi } from '@/api/game-server';

const props = defineProps<{ schoolId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const form = ref({ name: '', server: '', power: 0, master_name: '' });
const servers = ref<any[]>([]);
const loading = ref(false);
const isEdit = ref(false);

onMounted(async () => {
  const res: any = await getAllGameServersApi();
  servers.value = (res.data || []).filter((s: any) => s.status === 1);

  if (props.schoolId) {
    isEdit.value = true;
    const res: any = await getSchoolApi(props.schoolId);
    const s = res.data;
    form.value = { name: s.name || '', server: s.server || '', power: s.power || 0, master_name: s.master_name || '' };
  }
});

async function handleSubmit() {
  loading.value = true;
  try {
    if (isEdit.value) {
      const { server, ...data } = form.value;
      await updateSchoolApi(props.schoolId!, data);
    } else {
      const data = { ...form.value };
      await createSchoolApi(data);
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
    <n-form-item label="门派名" required><n-input v-model:value="form.name" /></n-form-item>
    <n-form-item label="服务器" :required="!isEdit">
      <n-select v-if="!isEdit" v-model:value="form.server" filterable placeholder="请选择服务器" :options="servers.map((s: any) => ({ label: s.name, value: s.name }))" />
      <n-input v-else :value="form.server" disabled />
    </n-form-item>
    <n-form-item label="战力"><n-input-number v-model:value="form.power" :min="0" style="width:100%" /></n-form-item>
    <n-form-item label="掌门"><n-input v-model:value="form.master_name" /></n-form-item>
    <n-button type="primary" block :loading="loading" @click="handleSubmit">
      {{ isEdit ? '保存修改' : '创建门派' }}
    </n-button>
  </n-form>
</template>
