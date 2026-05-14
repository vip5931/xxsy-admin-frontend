<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { NTable, NButton, NSpace, NModal, NCard, NPagination, NPopconfirm, NTag, NLayout, NLayoutSider, NLayoutContent, useMessage } from 'naive-ui';
import { getSchoolsApi, deleteSchoolApi } from '@/api/school';
import { getAllGameServersApi } from '@/api/game-server';
import { usePermissionStore } from '@/stores/permission';
import SchoolForm from './SchoolForm.vue';

const message = useMessage();
const permStore = usePermissionStore();
const state = reactive({ list: [] as any[], total: 0, page: 1, pageSize: 10, loading: false, selectedServer: '' });
const servers = reactive({ list: [] as any[], loading: false });
const showForm = reactive({ visible: false, schoolId: null as number | null });

const canCreate = permStore.hasPermission('school:create');
const canUpdate = permStore.hasPermission('school:update');
const canDelete = permStore.hasPermission('school:delete');

async function fetchServers() {
  servers.loading = true;
  try { const res: any = await getAllGameServersApi(); servers.list = res.data || []; } catch { /* empty */ }
  finally { servers.loading = false; }
}

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getSchoolsApi({ page: state.page, pageSize: state.pageSize, server: state.selectedServer || undefined });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch { message.error('加载门派列表失败'); }
  finally { state.loading = false; }
}

function selectServer(server: string) { state.selectedServer = state.selectedServer === server ? '' : server; state.page = 1; fetchData(); }

function handleCreate() { showForm.schoolId = null; showForm.visible = true; }
function handleEdit(id: number) { showForm.schoolId = id; showForm.visible = true; }
function handleFormClose() { showForm.visible = false; fetchData(); }

async function handleDelete(id: number) {
  try { await deleteSchoolApi(id); message.success('删除成功'); fetchData(); } catch { message.error('删除失败'); }
}

function onPageChange(page: number) { state.page = page; fetchData(); }

onMounted(() => { fetchServers(); fetchData(); });
</script>

<template>
  <n-layout has-sider style="height: calc(100vh - 120px)">
    <n-layout-sider width="180" bordered style="padding: 12px; overflow-y: auto">
      <div style="font-weight: bold; margin-bottom: 8px">区服筛选</div>
      <div v-for="s in servers.list" :key="s.id"
        :style="{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', marginBottom: '2px', background: state.selectedServer === s.name ? 'var(--primary-color-hover)' : 'transparent', color: state.selectedServer === s.name ? '#fff' : 'inherit' }"
        @click="selectServer(s.name)">
        {{ s.name }}
      </div>
    </n-layout-sider>
    <n-layout-content style="padding: 0 0 0 16px">
      <n-space justify="space-between" style="margin-bottom: 16px">
        <h2>门派管理</h2>
        <n-button v-if="canCreate" type="primary" @click="handleCreate">新建门派</n-button>
      </n-space>

      <n-table :loading="state.loading" :single-line="false">
        <thead>
          <tr><th>ID</th><th>门派名</th><th>服务器</th><th>战力</th><th>掌门</th><th v-if="canUpdate || canDelete">操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in state.list" :key="row.id">
            <td>{{ row.id }}</td>
            <td>{{ row.name || '-' }}</td>
            <td><n-tag size="small">{{ row.address || '-' }}</n-tag></td>
            <td>{{ row.power?.toLocaleString() || '-' }}</td>
            <td>{{ row.type || '-' }}</td>
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
          :page="state.page" :page-size="state.pageSize" :item-count="state.total" :page-sizes="[10, 20, 50]" show-size-picker
          @update:page="onPageChange"
          @update:page-size="(size: number) => { state.pageSize = size; fetchData(); }"
        />
      </div>

      <n-modal v-model:show="showForm.visible" :title="showForm.schoolId ? '编辑门派' : '新建门派'" style="max-width: 480px">
        <n-card><SchoolForm :school-id="showForm.schoolId" @close="handleFormClose" /></n-card>
      </n-modal>
    </n-layout-content>
  </n-layout>
</template>
