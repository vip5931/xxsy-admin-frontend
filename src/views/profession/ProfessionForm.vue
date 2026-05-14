<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui';
import { createProfessionApi, updateProfessionApi, getProfessionApi } from '@/api/profession';

const props = defineProps<{ professionId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const form = ref({ name: '' });
const loading = ref(false);
const isEdit = ref(false);

onMounted(async () => {
  if (props.professionId) {
    isEdit.value = true;
    const res: any = await getProfessionApi(props.professionId);
    form.value = { name: res.data.name };
  }
});

async function handleSubmit() {
  if (!form.value.name.trim()) {
    message.warning('请输入职业名称');
    return;
  }
  loading.value = true;
  try {
    if (isEdit.value) {
      await updateProfessionApi(props.professionId!, form.value);
    } else {
      await createProfessionApi(form.value);
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
    <n-form-item label="职业名称" required>
      <n-input v-model:value="form.name" placeholder="请输入职业名称" />
    </n-form-item>
    <n-button type="primary" block :loading="loading" @click="handleSubmit">
      {{ isEdit ? '保存修改' : '创建职业' }}
    </n-button>
  </n-form>
</template>
