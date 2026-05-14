<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, NInputNumber, NButton, useMessage } from 'naive-ui';
import { createSchoolApi, updateSchoolApi, getSchoolApi } from '@/api/school';

const props = defineProps<{ schoolId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const form = ref({ name: '', server: '', power: 0, master_name: '' });
const loading = ref(false);
const isEdit = ref(false);

onMounted(async () => {
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
    const data = { ...form.value };
    if (isEdit.value) {
      await updateSchoolApi(props.schoolId!, data);
    } else {
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
    <n-form-item label="服务器" required><n-input v-model:value="form.server" /></n-form-item>
    <n-form-item label="战力"><n-input-number v-model:value="form.power" :min="0" style="width:100%" /></n-form-item>
    <n-form-item label="掌门"><n-input v-model:value="form.master_name" /></n-form-item>
    <n-button type="primary" block :loading="loading" @click="handleSubmit">
      {{ isEdit ? '保存修改' : '创建门派' }}
    </n-button>
  </n-form>
</template>
