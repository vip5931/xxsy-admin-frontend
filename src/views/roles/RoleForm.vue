<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { NForm, NFormItem, NInput, NButton, NCheckboxGroup, NCheckbox, NCard, NDivider, NSpace, NGrid, NGi, useMessage } from 'naive-ui';
import { createRoleApi, updateRoleApi, getRoleApi, getAllPermissionsApi, assignPermissionsApi } from '@/api/roles';

const props = defineProps<{ roleId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const RESOURCE_LABELS: Record<string, string> = {
  dashboard: '仪表盘',
  users: '用户管理',
  roles: '角色管理',
  rank: '排行榜管理',
  school: '门派管理',
  'game-server': '区服管理',
  'ai-record': 'AI分析记录',
  'audit-log': '操作日志',
  profession: '职业管理',
  server: '区服权限',
};

const form = ref({ name: '', code: '', description: '', permissionIds: [] as number[] });
const permissionsGrouped = ref<[string, any[]][]>([]);
const loading = ref(false);
const isEdit = ref(false);

onMounted(async () => {
  const permsRes: any = await getAllPermissionsApi();
  const allPerms: any[] = permsRes.data;
  const map: Record<string, any[]> = {};
  for (const perm of allPerms) {
    if (!map[perm.resource]) map[perm.resource] = [];
    map[perm.resource].push(perm);
  }
  permissionsGrouped.value = Object.entries(map);

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
    <n-form-item label="名称" required>
      <n-input v-model:value="form.name" placeholder="角色名称" />
    </n-form-item>
    <n-form-item v-if="!isEdit" label="编码" required>
      <n-input v-model:value="form.code" placeholder="角色编码" />
    </n-form-item>
    <n-form-item label="描述">
      <n-input v-model:value="form.description" type="textarea" placeholder="角色描述" />
    </n-form-item>

    <n-form-item label="权限分配">
      <n-space vertical style="width: 100%">
        <n-card v-for="[resource, perms] in permissionsGrouped" :key="resource" size="small" style="margin-bottom: 4px">
          <template #header>
            {{ RESOURCE_LABELS[resource] || resource }}
          </template>
          <n-checkbox-group v-model:value="form.permissionIds">
            <n-space>
              <n-checkbox v-for="p in perms" :key="p.id" :value="p.id" :label="p.name" />
            </n-space>
          </n-checkbox-group>
        </n-card>
      </n-space>
    </n-form-item>

    <n-button type="primary" block :loading="loading" @click="handleSubmit">
      {{ isEdit ? '保存修改' : '创建角色' }}
    </n-button>
  </n-form>
</template>
