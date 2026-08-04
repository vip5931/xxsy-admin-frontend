<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import {
  NTable,
  NButton,
  NTag,
  NSpace,
  NModal,
  NCard,
  NPagination,
  NPopconfirm,
  useMessage,
} from 'naive-ui';
import { getGameServersApi, deleteGameServerApi } from '@/api/game-server';
import { usePermissionStore } from '@/stores/permission';
import GameServerForm from './GameServerForm.vue';
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
const showForm = reactive({ visible: false, serverId: null as number | null });

const canCreate = permStore.hasPermission('game-server:create');
const canUpdate = permStore.hasPermission('game-server:update');
const canDelete = permStore.hasPermission('game-server:delete');

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getGameServersApi({ page: state.page, pageSize: state.pageSize });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch {
    message.error('加载区服列表失败');
  } finally {
    state.loading = false;
  }
}

function handleCreate() {
  showForm.serverId = null;
  showForm.visible = true;
}

function handleEdit(id: number) {
  showForm.serverId = id;
  showForm.visible = true;
}

function handleFormClose() {
  showForm.visible = false;
  fetchData();
}

async function handleDelete(id: number) {
  try {
    await deleteGameServerApi(id);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  }
}

function onPageChange(page: number) {
  state.page = page;
  fetchData();
}

onMounted(fetchData);
</script>

<template>
  <n-card class="page-card" :bordered="false">
    <PageHeader title="区服管理" description="维护游戏区服字典，供战力排行与门派排行数据引用">
      <n-button v-if="canCreate" type="primary" @click="handleCreate">新建区服</n-button>
    </PageHeader>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr>
          <th style="width: 64px">序号</th>
          <th>区服名称</th>
          <th>编码</th>
          <th style="width: 90px">排序</th>
          <th style="width: 90px">状态</th>
          <th v-if="canUpdate || canDelete" style="width: 160px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in state.list" :key="row.id">
          <td>{{ (state.page - 1) * state.pageSize + idx + 1 }}</td>
          <td>{{ row.name }}</td>
          <td><n-tag size="small" :bordered="false">{{ row.code }}</n-tag></td>
          <td>{{ row.sortOrder }}</td>
          <td>
            <n-tag :type="row.status === 1 ? 'success' : 'error'" size="small" :bordered="false">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </n-tag>
          </td>
          <td v-if="canUpdate || canDelete">
            <n-space>
              <n-button v-if="canUpdate" size="small" @click="handleEdit(row.id)">编辑</n-button>
              <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                <template #trigger>
                  <n-button size="small" type="error">删除</n-button>
                </template>
                确定删除区服「{{ row.name }}」？
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
        :page-sizes="[10, 20, 50]"
        show-size-picker
        @update:page="onPageChange"
        @update:page-size="(size: number) => { state.pageSize = size; fetchData(); }"
      />
    </div>

    <n-modal
      v-model:show="showForm.visible"
      :title="showForm.serverId ? '编辑区服' : '新建区服'"
      style="max-width: 480px"
    >
      <n-card>
        <GameServerForm :server-id="showForm.serverId" @close="handleFormClose" />
      </n-card>
    </n-modal>
  </n-card>
</template>
