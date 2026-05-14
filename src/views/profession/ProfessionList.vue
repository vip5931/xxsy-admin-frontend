<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { NTable, NButton, NTag, NSpace, NModal, NCard, NPagination, NPopconfirm, useMessage } from 'naive-ui';
import { getProfessionsApi, deleteProfessionApi } from '@/api/profession';
import { usePermissionStore } from '@/stores/permission';
import ProfessionForm from './ProfessionForm.vue';

const message = useMessage();
const permStore = usePermissionStore();
const state = reactive({ list: [] as any[], total: 0, page: 1, pageSize: 10, loading: false });
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
  } catch { message.error('加载职业列表失败'); }
  finally { state.loading = false; }
}

function handleCreate() { showForm.professionId = null; showForm.visible = true; }
function handleEdit(id: number) { showForm.professionId = id; showForm.visible = true; }
function handleFormClose() { showForm.visible = false; fetchData(); }

async function handleDelete(id: number) {
  try {
    await deleteProfessionApi(id);
    message.success('删除成功');
    fetchData();
  } catch { message.error('删除失败'); }
}

function onPageChange(page: number) { state.page = page; fetchData(); }

onMounted(fetchData);
</script>

<template>
  <div>
    <n-space justify="space-between" style="margin-bottom: 16px">
      <h2>职业管理</h2>
      <n-button v-if="canCreate" type="primary" @click="handleCreate">新建职业</n-button>
    </n-space>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr><th>ID</th><th>职业名称</th><th v-if="canUpdate || canDelete">操作</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td><n-tag size="small">{{ row.name }}</n-tag></td>
          <td v-if="canUpdate || canDelete">
            <n-space>
              <n-button v-if="canUpdate" size="small" @click="handleEdit(row.id)">编辑</n-button>
              <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                <template #trigger><n-button size="small" type="error">删除</n-button></template>
                确定删除职业「{{ row.name }}」？
              </n-popconfirm>
            </n-space>
          </td>
        </tr>
      </tbody>
    </n-table>

    <div style="margin-top: 16px; display: flex; justify-content: flex-end">
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

    <n-modal v-model:show="showForm.visible" :title="showForm.professionId ? '编辑职业' : '新建职业'" style="max-width: 360px">
      <n-card><ProfessionForm :profession-id="showForm.professionId" @close="handleFormClose" /></n-card>
    </n-modal>
  </div>
</template>
