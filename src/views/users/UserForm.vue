<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, NButton, NSelect, NMessageProvider, useMessage } from 'naive-ui';
import { createUserApi, updateUserApi, getUserApi, assignRolesApi } from '@/api/users';
import { getRolesApi } from '@/api/roles';

const props = defineProps<{ userId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const form = ref({ username: '', password: '', realName: '', email: '', roleIds: [] as number[] });
const roles = ref<any[]>([]);
const loading = ref(false);
const isEdit = ref(false);

onMounted(async () => {
  const rolesRes: any = await getRolesApi();
  roles.value = rolesRes.data;

  if (props.userId) {
    isEdit.value = true;
    const res: any = await getUserApi(props.userId);
    const u = res.data;
    form.value = { ...form.value, username: u.username, realName: u.realName || '', email: u.email || '' };
  }
});

async function handleSubmit() {
  loading.value = true;
  try {
    const data: any = { realName: form.value.realName, email: form.value.email };
    if (!isEdit.value) {
      data.username = form.value.username;
      data.password = form.value.password;
    }
    if (form.value.password) data.password = form.value.password;

    if (isEdit.value) {
      await updateUserApi(props.userId!, data);
      if (form.value.roleIds.length > 0) await assignRolesApi(props.userId!, form.value.roleIds);
    } else {
      data.roleIds = form.value.roleIds;
      await createUserApi(data);
    }
    message.success(isEdit.value ? '更新成功' : '创建成功');
    emit('close');
  } catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败');
  } finally { loading.value = false; }
}
</script>

<template>
  <n-message-provider>
    <n-form :model="form">
      <n-form-item v-if="!isEdit" label="用户名"><n-input v-model:value="form.username" /></n-form-item>
      <n-form-item label="密码"><n-input v-model:value="form.password" type="password" :placeholder="isEdit ? '留空则不修改' : '请输入密码'" /></n-form-item>
      <n-form-item label="姓名"><n-input v-model:value="form.realName" /></n-form-item>
      <n-form-item label="邮箱"><n-input v-model:value="form.email" /></n-form-item>
      <n-form-item label="角色">
        <n-select v-model:value="form.roleIds" multiple :options="roles.map((r: any) => ({ label: r.name, value: r.id }))" />
      </n-form-item>
      <n-button type="primary" block :loading="loading" @click="handleSubmit">
        {{ isEdit ? '保存修改' : '创建用户' }}
      </n-button>
    </n-form>
  </n-message-provider>
</template>
