<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import {
  NTable,
  NButton,
  NTag,
  NSpace,
  NModal,
  NCard,
  NPopconfirm,
  NPagination,
  useMessage,
} from 'naive-ui';
import { usePermissionStore } from '@/stores/permission';
import { getUsersApi, deleteUserApi } from '@/api/users';
import UserForm from './UserForm.vue';
import PageHeader from '@/components/PageHeader.vue';

const message = useMessage();
const permStore = usePermissionStore();
const state = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
});
const showForm = reactive({ visible: false, userId: null as number | null });

const canDelete = permStore.hasPermission('users:delete');

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getUsersApi({ page: state.page, pageSize: state.pageSize });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch {
    message.error('加载用户列表失败');
  } finally {
    state.loading = false;
  }
}

async function toggleStatus(row: any) {
  const newStatus = row.status === 1 ? 0 : 1;
  const { updateUserStatusApi } = await import('@/api/users');
  await updateUserStatusApi(row.id, newStatus);
  message.success('状态更新成功');
  fetchData();
}

async function handleDelete(id: number) {
  try {
    await deleteUserApi(id);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  }
}

function handleEdit(id: number) {
  showForm.userId = id;
  showForm.visible = true;
}

function handleCreate() {
  showForm.userId = null;
  showForm.visible = true;
}

function handleFormClose() {
  showForm.visible = false;
  fetchData();
}

function onPageChange(page: number) {
  state.page = page;
  fetchData();
}

onMounted(fetchData);
</script>

<template>
  <n-card class="page-card" :bordered="false">
    <PageHeader title="用户管理" description="管理后台用户账号、账号状态与角色分配">
      <n-button type="primary" @click="handleCreate">新建用户</n-button>
    </PageHeader>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr>
          <th style="width: 64px">ID</th>
          <th>用户名</th>
          <th>姓名</th>
          <th>邮箱</th>
          <th style="width: 90px">状态</th>
          <th>创建时间</th>
          <th style="width: 220px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td>{{ row.username }}</td>
          <td>{{ row.realName || '-' }}</td>
          <td>{{ row.email || '-' }}</td>
          <td>
            <n-tag :type="row.status === 1 ? 'success' : 'error'" size="small" :bordered="false">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </n-tag>
          </td>
          <td>{{ new Date(row.createdAt).toLocaleString('zh-CN') }}</td>
          <td>
            <n-space>
              <n-button size="small" @click="handleEdit(row.id)">编辑</n-button>
              <n-button
                size="small"
                :type="row.status === 1 ? 'warning' : 'success'"
                @click="toggleStatus(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
              </n-button>
              <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                <template #trigger>
                  <n-button size="small" type="error">删除</n-button>
                </template>
                确定删除用户「{{ row.username }}」？
              </n-popconfirm>
            </n-space>
          </td>
        </tr>
      </tbody>
    </n-table>

    <div class="table-footer">
      <n-pagination
        :page="state.page"
        :page-size="state.pageSize"
        :item-count="state.total"
        :page-sizes="[10, 20, 50, 100]"
        show-size-picker
        @update:page="onPageChange"
        @update:page-size="(size: number) => { state.pageSize = size; fetchData(); }"
      />
    </div>

    <n-modal
      v-model:show="showForm.visible"
      :title="showForm.userId ? '编辑用户' : '新建用户'"
      style="max-width: 520px"
    >
      <n-card>
        <UserForm :user-id="showForm.userId" @close="handleFormClose" />
      </n-card>
    </n-modal>
  </n-card>
</template>
