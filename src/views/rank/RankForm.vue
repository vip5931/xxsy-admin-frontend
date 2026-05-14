<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, useMessage } from 'naive-ui';
import { createRankApi, updateRankApi, getRankApi } from '@/api/rank';
import { getAllGameServersApi } from '@/api/game-server';

const props = defineProps<{ rankId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const form = ref({ role_name: '', server_name: '', profession: '', combat_power: 0 });
const servers = ref<any[]>([]);
const loading = ref(false);
const isEdit = ref(false);

onMounted(async () => {
  const res: any = await getAllGameServersApi();
  servers.value = (res.data || []).filter((s: any) => s.status === 1);

  if (props.rankId) {
    isEdit.value = true;
    const res: any = await getRankApi(props.rankId);
    const r = res.data;
    form.value = { role_name: r.name || '', server_name: r.server || '', profession: r.rank || '', combat_power: r.score || 0 };
  }
});

async function handleSubmit() {
  loading.value = true;
  try {
    if (isEdit.value) {
      const { server_name, ...data } = form.value;
      await updateRankApi(props.rankId!, data);
    } else {
      await createRankApi(form.value);
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
    <n-form-item label="角色名" required><n-input v-model:value="form.role_name" /></n-form-item>
    <n-form-item label="区服" :required="!isEdit">
      <n-select v-if="!isEdit" v-model:value="form.server_name" filterable :options="servers.map((s: any) => ({ label: s.name, value: s.name }))" />
      <n-input v-else :value="form.server_name" disabled />
    </n-form-item>
    <n-form-item label="职业"><n-input v-model:value="form.profession" /></n-form-item>
    <n-form-item label="战力"><n-input-number v-model:value="form.combat_power" :min="0" style="width:100%" /></n-form-item>
    <n-button type="primary" block :loading="loading" @click="handleSubmit">
      {{ isEdit ? '保存修改' : '创建排行' }}
    </n-button>
  </n-form>
</template>
