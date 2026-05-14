<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { NTable, NButton, NTag, NSpace, NModal, NCard, NPopconfirm, useMessage } from 'naive-ui';
import { usePermissionStore } from '@/stores/permission';
import { getUsersApi, deleteUserApi } from '@/api/users';
import UserForm from './UserForm.vue';

const message = useMessage();
const permStore = usePermissionStore();
const state = reactive({ list: [] as any[], total: 0, page: 1, pageSize: 10, loading: false });
const showForm = reactive({ visible: false, userId: null as number | null });

const canDelete = permStore.hasPermission('users:delete');

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getUsersApi({ page: state.page, pageSize: state.pageSize });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch { message.error('加载用户列表失败'); }
  finally { state.loading = false; }
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1;
  const { updateUserStatusApi } = await import('@/api/users');
  await updateUserStatusApi(row.id, newStatus);
  message.success('状态更新成功');
  fetchData();
}

async function handleDelete(id: number) {
  try { await deleteUserApi(id); message.success('删除成功'); fetchData(); } catch { message.error('删除失败'); }
}

function handleEdit(id: number) { showForm.userId = id; showForm.visible = true; }
function handleCreate() { showForm.userId = null; showForm.visible = true; }
function handleFormClose() { showForm.visible = false; fetchData(); }

onMounted(fetchData);
</script>

<template>
  <div>
      <n-space justify="space-between" style="margin-bottom: 16px">
        <h2>用户管理</h2>
        <n-button type="primary" @click="handleCreate">新建用户</n-button>
      </n-space>

      <n-table :loading="state.loading" :single-line="false">
        <thead>
          <tr><th>ID</th><th>用户名</th><th>姓名</th><th>邮箱</th><th>状态</th><th>创建时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in state.list" :key="row.id">
            <td>{{ row.id }}</td>
            <td>{{ row.username }}</td>
            <td>{{ row.realName || '-' }}</td>
            <td>{{ row.email || '-' }}</td>
            <td>
              <n-tag :type="row.status === 1 ? 'success' : 'error'" size="small">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </n-tag>
            </td>
            <td>{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</td>
            <td>
              <n-space>
                <n-button size="small" @click="handleEdit(row.id)">编辑</n-button>
                <n-button size="small" :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">
                  {{ row.status === 1 ? '禁用' : '启用' }}
                </n-button>
                <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                  <template #trigger><n-button size="small" type="error">删除</n-button></template>
                  确定删除用户「{{ row.username }}」？
                </n-popconfirm>
              </n-space>
            </td>
          </tr>
        </tbody>
      </n-table>

      <n-modal v-model:show="showForm.visible" :title="showForm.userId ? '编辑用户' : '新建用户'" style="max-width: 520px">
        <n-card><UserForm :user-id="showForm.userId" @close="handleFormClose" /></n-card>
      </n-modal>
  </div>
</template>
