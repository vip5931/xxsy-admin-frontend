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
import { getProfessionsApi, deleteProfessionApi } from '@/api/profession';
import { usePermissionStore } from '@/stores/permission';
import ProfessionForm from './ProfessionForm.vue';
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
const showForm = reactive({ visible: false, professionId: null as number | null });

const canCreate = permStore.hasPermission('profession:create');
const canUpdate = permStore.hasPermission('profession:update');
const canDelete = permStore.hasPermission('profession:delete');

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getProfessionsApi({ page: state.page, pageSize: state.pageSize });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch {
    message.error('加载职业列表失败');
  } finally {
    state.loading = false;
  }
}

function handleCreate() {
  showForm.professionId = null;
  showForm.visible = true;
}

function handleEdit(id: number) {
  showForm.professionId = id;
  showForm.visible = true;
}

function handleFormClose() {
  showForm.visible = false;
  fetchData();
}

async function handleDelete(id: number) {
  try {
    await deleteProfessionApi(id);
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
    <PageHeader title="职业管理" description="维护游戏职业字典，供排行数据使用">
      <n-button v-if="canCreate" type="primary" @click="handleCreate">新建职业</n-button>
    </PageHeader>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr>
          <th style="width: 64px">序号</th>
          <th>职业名称</th>
          <th v-if="canUpdate || canDelete" style="width: 160px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in state.list" :key="row.id">
          <td>{{ (state.page - 1) * state.pageSize + idx + 1 }}</td>
          <td><n-tag size="small" :bordered="false">{{ row.name }}</n-tag></td>
          <td v-if="canUpdate || canDelete">
            <n-space>
              <n-button v-if="canUpdate" size="small" @click="handleEdit(row.id)">编辑</n-button>
              <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                <template #trigger>
                  <n-button size="small" type="error">删除</n-button>
                </template>
                确定删除职业「{{ row.name }}」？
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
      :title="showForm.professionId ? '编辑职业' : '新建职业'"
      style="max-width: 360px"
    >
      <n-card>
        <ProfessionForm :profession-id="showForm.professionId" @close="handleFormClose" />
      </n-card>
    </n-modal>
  </n-card>
</template>
