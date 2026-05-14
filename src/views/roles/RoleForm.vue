<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, NButton, NCheckboxGroup, NCheckbox, useMessage } from 'naive-ui';
import { createRoleApi, updateRoleApi, getRoleApi, getAllPermissionsApi, assignPermissionsApi } from '@/api/roles';

const props = defineProps<{ roleId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const form = ref({ name: '', code: '', description: '', permissionIds: [] as number[] });
const allPermissions = ref<any[]>([]);
const permissionsGrouped = ref<Record<string, any[]>>({});
const loading = ref(false);
const isEdit = ref(false);

onMounted(async () => {
  const permsRes: any = await getAllPermissionsApi();
  allPermissions.value = permsRes.data;
  for (const perm of allPermissions.value) {
    if (!permissionsGrouped.value[perm.resource]) permissionsGrouped.value[perm.resource] = [];
    permissionsGrouped.value[perm.resource].push(perm);
  }

  if (props.roleId) {
    isEdit.value = true;
    const res: any = await getRoleApi(props.roleId);
    const r = res.data;
    form.value.name = r.name;
    form.value.code = r.code;
    form.value.description = r.description || '';
    form.value.permissionIds = r.rolePermissions?.map((rp: any) => rp.permissionId) || [];
  }
});

async function handleSubmit() {
  loading.value = true;
  try {
    const data: any = { name: form.value.name, code: form.value.code, description: form.value.description };
    if (isEdit.value) {
      await updateRoleApi(props.roleId!, data);
      await assignPermissionsApi(props.roleId!, form.value.permissionIds);
    } else {
      data.permissionIds = form.value.permissionIds;
      await createRoleApi(data);
    }
    message.success(isEdit.value ? '更新成功' : '创建成功');
    emit('close');
  } catch (e: any) { message.error(e?.response?.data?.message || '操作失败'); }
  finally { loading.value = false; }
}
</script>

<template>
  <n-form :model="form">
    <n-form-item label="名称"><n-input v-model:value="form.name" /></n-form-item>
    <n-form-item v-if="!isEdit" label="编码"><n-input v-model:value="form.code" /></n-form-item>
    <n-form-item label="描述"><n-input v-model:value="form.description" type="textarea" /></n-form-item>
    <n-form-item label="权限">
      <div v-for="(perms, resource) in permissionsGrouped" :key="resource" style="margin-bottom: 12px">
        <strong>{{ resource }}</strong>
        <n-checkbox-group v-model:value="form.permissionIds">
          <n-checkbox v-for="p in perms" :key="p.id" :value="p.id" :label="p.name" style="margin-right: 12px" />
        </n-checkbox-group>
      </div>
    </n-form-item>
    <n-button type="primary" block :loading="loading" @click="handleSubmit">
      {{ isEdit ? '保存修改' : '创建角色' }}
    </n-button>
  </n-form>
</template>
