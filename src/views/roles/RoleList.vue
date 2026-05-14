<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { NTable, NButton, NTag, NSpace, NModal, NCard, useMessage, NPopconfirm } from 'naive-ui';
import { getRolesApi, deleteRoleApi } from '@/api/roles';
import RoleForm from './RoleForm.vue';

const message = useMessage();
const state = reactive({ list: [] as any[], loading: false });
const showForm = reactive({ visible: false, roleId: null as number | null });

async function fetchData() {
  state.loading = true;
  try { const res: any = await getRolesApi(); state.list = res.data; } catch { message.error('加载失败'); }
  finally { state.loading = false; }
}

async function handleDelete(id: number) {
  await deleteRoleApi(id);
  message.success('删除成功');
  fetchData();
}

function handleEdit(id: number) { showForm.roleId = id; showForm.visible = true; }
function handleCreate() { showForm.roleId = null; showForm.visible = true; }
function handleFormClose() { showForm.visible = false; fetchData(); }

onMounted(fetchData);
</script>

<template>
  <div>
    <n-space justify="space-between" style="margin-bottom: 16px">
      <h2>角色管理</h2>
      <n-button type="primary" @click="handleCreate">新建角色</n-button>
    </n-space>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr><th>ID</th><th>名称</th><th>编码</th><th>描述</th><th>用户数</th><th>权限数</th><th>操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td>{{ row.name }}</td>
          <td><n-tag size="small">{{ row.code }}</n-tag></td>
          <td>{{ row.description || '-' }}</td>
          <td>{{ row._count?.userRoles || 0 }}</td>
          <td>{{ row.rolePermissions?.length || 0 }}</td>
          <td>
            <n-space>
              <n-button size="small" @click="handleEdit(row.id)">编辑/分配权限</n-button>
              <n-popconfirm @positive-click="() => handleDelete(row.id)">
                <template #trigger><n-button size="small" type="error">删除</n-button></template>
                确认删除该角色？
              </n-popconfirm>
            </n-space>
          </td>
        </tr>
      </tbody>
    </n-table>

    <n-modal v-model:show="showForm.visible" :title="showForm.roleId ? '编辑角色' : '新建角色'" style="max-width: 720px">
      <n-card><RoleForm :role-id="showForm.roleId" @close="handleFormClose" /></n-card>
    </n-modal>
  </div>
</template>
