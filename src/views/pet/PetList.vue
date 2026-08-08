<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue';
import {
  NTable,
  NButton,
  NSpace,
  NModal,
  NCard,
  NPagination,
  NPopconfirm,
  NTag,
  NInput,
  NCheckbox,
  NImage,
  NEmpty,
  useMessage,
} from 'naive-ui';
import { getPetsApi, deletePetApi, batchDeletePetsApi } from '@/api/pet';
import { usePermissionStore } from '@/stores/permission';
import PetForm from './PetForm.vue';
import PageHeader from '@/components/PageHeader.vue';

const message = useMessage();
const permStore = usePermissionStore();

const state = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  loading: false,
  keyword: '',
  checkedIds: new Set<number>(),
});
const showForm = reactive({ visible: false, petId: null as number | null });
const batchDeleting = reactive({ loading: false });

const canCreate = permStore.hasPermission('pet:create');
const canUpdate = permStore.hasPermission('pet:update');
const canDelete = permStore.hasPermission('pet:delete');

const allChecked = computed(() =>
  state.list.length > 0 && state.list.every((row) => state.checkedIds.has(row.id)),
);

async function fetchData() {
  state.loading = true;
  state.checkedIds.clear();
  try {
    const res: any = await getPetsApi({
      page: state.page,
      pageSize: state.pageSize,
      keyword: state.keyword || undefined,
    });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch {
    message.error('加载捉宠列表失败');
  } finally {
    state.loading = false;
  }
}

function onSearch() {
  state.page = 1;
  fetchData();
}

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
    state.list.forEach((row) => state.checkedIds.add(row.id));
  }
}

async function handleBatchDelete() {
  batchDeleting.loading = true;
  try {
    const ids = Array.from(state.checkedIds);
    await batchDeletePetsApi(ids);
    message.success(`成功删除 ${ids.length} 条`);
    state.checkedIds.clear();
    fetchData();
  } catch {
    message.error('批量删除失败');
  } finally {
    batchDeleting.loading = false;
  }
}

function handleCreate() {
  showForm.petId = null;
  showForm.visible = true;
}

function handleEdit(id: number) {
  showForm.petId = id;
  showForm.visible = true;
}

function handleFormClose() {
  showForm.visible = false;
  fetchData();
}

async function handleDelete(id: number) {
  try {
    await deletePetApi(id);
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
    <PageHeader title="捉宠管理" description="管理捉宠地图与宠物位置数据，图片存储于阿里云 OSS">
      <n-space>
        <n-popconfirm
          v-if="canDelete && state.checkedIds.size > 0"
          @positive-click="handleBatchDelete"
        >
          <template #trigger>
            <n-button type="error" :loading="batchDeleting.loading">
              批量删除 ({{ state.checkedIds.size }})
            </n-button>
          </template>
          确定删除选中的 {{ state.checkedIds.size }} 条捉宠记录？
        </n-popconfirm>
        <n-button v-if="canCreate" type="primary" @click="handleCreate">新建捉宠</n-button>
      </n-space>
    </PageHeader>

    <div class="filter-bar">
      <n-input
        v-model:value="state.keyword"
        placeholder="搜索地图名称或宠物名称"
        clearable
        style="width: 260px"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <n-button type="primary" secondary @click="onSearch">搜索</n-button>
    </div>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr>
          <th style="width: 40px">
            <n-checkbox :checked="allChecked" @update:checked="toggleAll" />
          </th>
          <th style="width: 64px">#</th>
          <th>地图名称</th>
          <th style="width: 180px">地图图片</th>
          <th>宠物列表</th>
          <th style="width: 80px">排序</th>
          <th v-if="canUpdate || canDelete" style="width: 150px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in state.list" :key="row.id">
          <td>
            <n-checkbox
              :checked="state.checkedIds.has(row.id)"
              @update:checked="() => toggleCheck(row.id)"
            />
          </td>
          <td>{{ (state.page - 1) * state.pageSize + idx + 1 }}</td>
          <td>
            <n-space :size="6" align="center">
              <span style="font-weight: 600">{{ row.mapName || '-' }}</span>
              <n-tag v-if="row.isNew" type="success" size="tiny" :bordered="false">新</n-tag>
            </n-space>
          </td>
          <td>
            <n-image
              v-if="row.mapImage"
              :src="row.mapImage"
              :preview-src="row.mapImage"
              width="120"
              height="68"
              object-fit="cover"
              style="border-radius: 4px"
            />
            <span v-else style="color: var(--text-color-3)">无图片</span>
          </td>
          <td>
            <n-space :size="6" wrap>
              <template v-for="(pet, i) in (row.pets || [])" :key="i">
                <n-tag
                  v-if="i < 5"
                  size="small"
                  :bordered="false"
                  style="margin-bottom: 2px"
                >
                  {{ pet }}
                </n-tag>
              </template>
              <n-tag
                v-if="(row.pets || []).length > 5"
                size="small"
                type="info"
                :bordered="false"
              >
                +{{ (row.pets || []).length - 5 }}
              </n-tag>
              <span
                v-if="!(row.pets || []).length"
                style="color: var(--text-color-3)"
              >
                无宠物
              </span>
            </n-space>
          </td>
          <td>{{ row.sortOrder ?? 0 }}</td>
          <td v-if="canUpdate || canDelete">
            <n-space>
              <n-button v-if="canUpdate" size="small" @click="handleEdit(row.id)">编辑</n-button>
              <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                <template #trigger>
                  <n-button size="small" type="error">删除</n-button>
                </template>
                确定删除捉宠地图「{{ row.mapName }}」？
              </n-popconfirm>
            </n-space>
          </td>
        </tr>
      </tbody>
    </n-table>

    <n-empty
      v-if="!state.loading && state.list.length === 0"
      description="暂无捉宠数据"
      style="padding: 40px 0"
    />

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
      :title="showForm.petId ? '编辑捉宠' : '新建捉宠'"
      style="max-width: 520px"
    >
      <n-card>
        <PetForm :pet-id="showForm.petId" @close="handleFormClose" />
      </n-card>
    </n-modal>
  </n-card>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
