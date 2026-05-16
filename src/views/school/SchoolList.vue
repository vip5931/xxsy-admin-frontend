<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { NTable, NButton, NSpace, NModal, NCard, NPagination, NPopconfirm, NTag, NSelect, NCheckbox, useMessage } from 'naive-ui';
import { getSchoolsApi, deleteSchoolApi, batchDeleteSchoolsApi } from '@/api/school';
import { getAllGameServersApi } from '@/api/game-server';
import { usePermissionStore } from '@/stores/permission';
import SchoolForm from './SchoolForm.vue';
import SchoolAiModal from './SchoolAiModal.vue';

const message = useMessage();
const permStore = usePermissionStore();
const state = reactive({
  list: [] as any[], total: 0, page: 1, pageSize: 10, loading: false,
  selectedServer: null as string | null, checkedIds: new Set<number>(),
});
const servers = reactive({ list: [] as any[], loading: false });
const showAiModal = ref(false);
const showForm = reactive({ visible: false, schoolId: null as number | null });
const batchDeleting = reactive({ loading: false });

const canCreate = permStore.hasPermission('school:create');
const canUpdate = permStore.hasPermission('school:update');
const canDelete = permStore.hasPermission('school:delete');

const allChecked = computed(() => state.list.length > 0 && state.list.every(row => state.checkedIds.has(row.id)));

async function fetchServers() {
  servers.loading = true;
  try { const res: any = await getAllGameServersApi(); servers.list = res.data || []; } catch { /* empty */ }
  finally { servers.loading = false; }
}

async function fetchData() {
  state.loading = true;
  state.checkedIds.clear();
  try {
    const res: any = await getSchoolsApi({ page: state.page, pageSize: state.pageSize, server: state.selectedServer || undefined });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch { message.error('加载门派列表失败'); }
  finally { state.loading = false; }
}

function onServerFilter(val: string | null) { state.selectedServer = val; state.page = 1; fetchData(); }

function toggleCheck(id: number) {
  if (state.checkedIds.has(id)) {
    state.checkedIds.delete(id);
  } else {
    state.checkedIds.add(id);
  }
}

function toggleAll() {
  if (allChecked.value) {
    state.checkedIds.clear();
  } else {
    state.list.forEach(row => state.checkedIds.add(row.id));
  }
}

async function handleBatchDelete() {
  batchDeleting.loading = true;
  try {
    const ids = Array.from(state.checkedIds);
    await batchDeleteSchoolsApi(ids);
    message.success(`成功删除 ${ids.length} 条`);
    state.checkedIds.clear();
    fetchData();
  } catch { message.error('批量删除失败'); }
  finally { batchDeleting.loading = false; }
}

function handleCreate() { showForm.schoolId = null; showForm.visible = true; }
function handleEdit(id: number) { showForm.schoolId = id; showForm.visible = true; }
function handleFormClose() { showForm.visible = false; fetchData(); }

async function handleDelete(id: number) {
  try { await deleteSchoolApi(id); message.success('删除成功'); fetchData(); } catch { message.error('删除失败'); }
}

function onPageChange(page: number) { state.page = page; fetchData(); }

async function init() {
  await fetchServers();
  if (servers.list.length > 0) {
    state.selectedServer = servers.list[0].name;
  }
  fetchData();
}

onMounted(init);
</script>

<template>
  <div>
    <n-space justify="space-between" style="margin-bottom: 16px">
      <h2>门派管理</h2>
      <n-space>
        <n-popconfirm v-if="canDelete && state.checkedIds.size > 0" @positive-click="handleBatchDelete">
          <template #trigger>
            <n-button type="error" :loading="batchDeleting.loading">批量删除 ({{ state.checkedIds.size }})</n-button>
          </template>
          确定删除选中的 {{ state.checkedIds.size }} 条门派记录？
        </n-popconfirm>
        <n-button v-if="canCreate" type="info" @click="showAiModal = true">AI 识别</n-button>
        <n-button v-if="canCreate" type="primary" @click="handleCreate">新建门派</n-button>
      </n-space>
    </n-space>

    <n-space style="margin-bottom: 16px" align="center">
      <span style="font-size: 14px; color: var(--text-color-secondary)">区服筛选：</span>
      <n-select
        v-model:value="state.selectedServer"
        :options="servers.list.map((s: any) => ({ label: s.name, value: s.name }))"
        placeholder="全部区服"
        clearable style="width: 200px"
        @update:value="onServerFilter"
      />
    </n-space>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr>
          <th style="width:40px">
            <n-checkbox :checked="allChecked" @update:checked="toggleAll" />
          </th>
          <th>ID</th><th>门派名</th><th>服务器</th><th>战力</th><th>掌门</th>
          <th v-if="canUpdate || canDelete">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in state.list" :key="row.id">
          <td>
            <n-checkbox :checked="state.checkedIds.has(row.id)" @update:checked="() => toggleCheck(row.id)" />
          </td>
          <td>{{ (state.page - 1) * state.pageSize + idx + 1 }}</td>
          <td>{{ row.name || '-' }}</td>
          <td><n-tag size="small">{{ row.server || '-' }}</n-tag></td>
          <td>{{ row.power?.toLocaleString() || '-' }}</td>
          <td>{{ row.master_name || '-' }}</td>
          <td v-if="canUpdate || canDelete">
            <n-space>
              <n-button v-if="canUpdate" size="small" @click="handleEdit(row.id)">编辑</n-button>
              <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                <template #trigger><n-button size="small" type="error">删除</n-button></template>
                确定删除门派「{{ row.name }}」？
              </n-popconfirm>
            </n-space>
          </td>
        </tr>
      </tbody>
    </n-table>

    <div style="margin-top: 16px; display: flex; justify-content: flex-end">
      <n-pagination
        :page="state.page" :page-size="state.pageSize" :item-count="state.total"
        :page-sizes="[10, 20, 50, 100]" show-size-picker
        @update:page="onPageChange"
        @update:page-size="(size: number) => { state.pageSize = size; fetchData(); }"
      />
    </div>

    <n-modal v-model:show="showForm.visible" :title="showForm.schoolId ? '编辑门派' : '新建门派'" style="max-width: 420px">
      <n-card><SchoolForm :school-id="showForm.schoolId" @close="handleFormClose" /></n-card>
    </n-modal>

    <SchoolAiModal
      :visible="showAiModal"
      :servers="servers.list.map((s: any) => s.name)"
      @close="showAiModal = false"
      @success="fetchData"
    />
  </div>
</template>
