<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import {
  NTable,
  NButton,
  NTag,
  NSpace,
  NInput,
  NModal,
  NCard,
  NPagination,
  NPopconfirm,
  NEmpty,
  NImage,
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  NSelect,
  NDatePicker,
  useMessage,
} from 'naive-ui';
import {
  getNoticesApi,
  getNoticeApi,
  createNoticeApi,
  updateNoticeApi,
  deleteNoticeApi,
  uploadNoticeImageApi,
} from '@/api/notice';
import { usePermissionStore } from '@/stores/permission';
import PageHeader from '@/components/PageHeader.vue';

const message = useMessage();
const permStore = usePermissionStore();
const canCreate = permStore.hasPermission('notice:create');
const canUpdate = permStore.hasPermission('notice:update');
const canDelete = permStore.hasPermission('notice:delete');

const state = reactive({
  list: [] as any[],
  total: 0,
  page: 1,
  pageSize: 10,
  keyword: '',
  loading: false,
});

const modalVisible = ref(false);
const editId = ref<number | null>(null);
const saving = ref(false);
const uploading = ref(false);
const uploadInput = ref<HTMLInputElement | null>(null);
const form = reactive({
  title: '',
  content: '',
  images: [] as string[],
  type: 'notice',
  status: 1,
  sort: 0,
  publishedAt: null as number | null,
});

const typeOptions = [
  { label: '功能公告', value: 'notice' },
  { label: '使用教程', value: 'guide' },
  { label: '玩法说明', value: 'play' },
];

async function fetchData() {
  state.loading = true;
  try {
    const res: any = await getNoticesApi({
      page: state.page,
      pageSize: state.pageSize,
      keyword: state.keyword || undefined,
    });
    state.list = res.data.list;
    state.total = res.data.total;
  } catch {
    message.error('加载消息通知失败');
  } finally {
    state.loading = false;
  }
}

function handleSearch() {
  state.page = 1;
  fetchData();
}

function onPageChange(page: number) {
  state.page = page;
  fetchData();
}

function resetForm() {
  form.title = '';
  form.content = '';
  form.images = [];
  form.type = 'notice';
  form.status = 1;
  form.sort = 0;
  form.publishedAt = null;
}

function openCreate() {
  editId.value = null;
  resetForm();
  modalVisible.value = true;
}

async function openEdit(row: any) {
  editId.value = row.id;
  resetForm();
  modalVisible.value = true;
  try {
    const res: any = await getNoticeApi(row.id);
    const d = res.data;
    form.title = d.title || '';
    form.content = d.content || '';
    form.images = Array.isArray(d.images) ? d.images : [];
    form.type = d.type || 'notice';
    form.status = d.status ?? 1;
    form.sort = d.sort || 0;
    form.publishedAt = d.publishedAt ? new Date(d.publishedAt.replace(' ', 'T')).getTime() : null;
  } catch {
    message.error('加载详情失败');
    modalVisible.value = false;
  }
}

function formatDateTime(ts: number | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

async function handleSubmit() {
  if (!form.title.trim()) {
    message.warning('请输入标题');
    return;
  }
  saving.value = true;
  const payload = {
    title: form.title.trim(),
    content: form.content.trim(),
    images: form.images,
    type: form.type,
    status: form.status,
    sort: form.sort,
    publishedAt: formatDateTime(form.publishedAt),
  };
  try {
    if (editId.value) {
      await updateNoticeApi(editId.value, payload);
    } else {
      await createNoticeApi(payload);
    }
    message.success(editId.value ? '更新成功' : '创建成功');
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e?.response?.data?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function handleFiles(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  target.value = '';
  if (!files.length) return;
  if (form.images.length + files.length > 9) {
    message.warning('最多上传 9 张图片');
    return;
  }
  uploading.value = true;
  try {
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        message.warning(`跳过非图片文件：${file.name}`);
        continue;
      }
      const res: any = await uploadNoticeImageApi(file);
      const url = res?.data?.url || res?.url || '';
      if (url) form.images.push(url);
    }
    message.success('图片上传完成');
  } catch (e: any) {
    message.error(e?.response?.data?.message || '图片上传失败，请检查 OSS 配置');
  } finally {
    uploading.value = false;
  }
}

function removeImage(index: number) {
  form.images.splice(index, 1);
}

async function handleToggleStatus(row: any) {
  try {
    await updateNoticeApi(row.id, { status: row.status === 1 ? 0 : 1 });
    message.success(row.status === 1 ? '已停用' : '已启用');
    fetchData();
  } catch {
    message.error('操作失败');
  }
}

async function handleDelete(id: number) {
  try {
    await deleteNoticeApi(id);
    message.success('删除成功');
    fetchData();
  } catch {
    message.error('删除失败');
  }
}

function typeLabel(t: string) {
  return typeOptions.find((o) => o.value === t)?.label || t || '公告';
}

function fmtTime(v: string | null) {
  if (!v) return '-';
  return v.replace('T', ' ').slice(0, 19);
}

onMounted(fetchData);
</script>

<template>
  <n-card class="page-card" :bordered="false">
    <PageHeader title="消息通知" description="管理小程序首页铃铛入口里的功能公告、使用教程与玩法说明；支持图文内容">
      <n-button v-if="canCreate" type="primary" @click="openCreate">新增消息</n-button>
    </PageHeader>

    <n-space style="margin-bottom: 12px" align="center">
      <n-input
        v-model:value="state.keyword"
        placeholder="搜索消息标题 / 内容"
        clearable
        style="width: 280px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <n-button type="primary" secondary @click="handleSearch">查询</n-button>
    </n-space>

    <n-table :loading="state.loading" :single-line="false">
      <thead>
        <tr>
          <th style="width: 64px">ID</th>
          <th>标题</th>
          <th style="width: 90px">类型</th>
          <th style="width: 120px">图片</th>
          <th style="width: 80px">状态</th>
          <th style="width: 80px">排序</th>
          <th style="width: 150px">发布时间</th>
          <th style="width: 200px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in state.list" :key="row.id">
          <td>{{ row.id }}</td>
          <td class="ellipsis" :title="row.title">{{ row.title }}</td>
          <td><n-tag size="small" :bordered="false">{{ typeLabel(row.type) }}</n-tag></td>
          <td>
            <n-image
              v-if="row.images && row.images.length"
              :src="row.images[0]"
              width="56"
              height="40"
              object-fit="cover"
              :preview-src="row.images[0]"
              style="border-radius: 6px"
            />
            <span v-else class="muted">-</span>
          </td>
          <td>
            <n-tag size="small" :bordered="false" :type="row.status === 1 ? 'success' : 'error'">
              {{ row.status === 1 ? '启用' : '停用' }}
            </n-tag>
          </td>
          <td>{{ row.sort }}</td>
          <td>{{ fmtTime(row.publishedAt) }}</td>
          <td>
            <n-space>
              <n-button v-if="canUpdate" size="small" @click="openEdit(row)">编辑</n-button>
              <n-button v-if="canUpdate" size="small" @click="handleToggleStatus(row)">
                {{ row.status === 1 ? '停用' : '启用' }}
              </n-button>
              <n-popconfirm v-if="canDelete" @positive-click="() => handleDelete(row.id)">
                <template #trigger>
                  <n-button size="small" type="error">删除</n-button>
                </template>
                确定删除《{{ row.title }}》？
              </n-popconfirm>
            </n-space>
          </td>
        </tr>
        <tr v-if="!state.loading && state.list.length === 0">
          <td colspan="8" style="text-align: center; padding: 32px">
            <n-empty description="暂无消息，点击右上角新增" />
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

    <n-modal v-model:show="modalVisible" preset="card" title="新增 / 编辑消息" style="width: 680px" :bordered="false">
      <n-form :model="form" label-placement="top">
        <n-form-item label="标题" required>
          <n-input v-model:value="form.title" placeholder="如：新增排行榜查询功能" maxlength="200" />
        </n-form-item>

        <n-form-item label="类型">
          <n-select v-model:value="form.type" :options="typeOptions" />
        </n-form-item>

        <n-form-item label="正文内容">
          <n-input
            v-model:value="form.content"
            type="textarea"
            :rows="6"
            placeholder="支持换行，填写功能说明 / 使用教程 / 更新内容"
          />
        </n-form-item>

        <n-form-item label="图片（最多 9 张）">
          <div class="image-list">
            <div v-for="(img, idx) in form.images" :key="img" class="image-item">
              <n-image :src="img" width="96" height="72" object-fit="cover" :preview-src="img" />
              <n-button size="tiny" type="error" tertiary class="remove-btn" @click="removeImage(idx)">移除</n-button>
            </div>
            <n-button
              v-if="form.images.length < 9"
              size="small"
              :loading="uploading"
              class="upload-btn"
              @click="uploadInput?.click()"
            >
              {{ uploading ? '上传中…' : '+ 上传图片' }}
            </n-button>
            <input
              ref="uploadInput"
              type="file"
              accept="image/*"
              multiple
              style="display: none"
              @change="handleFiles"
            />
          </div>
        </n-form-item>

        <n-space style="width: 100%">
          <n-form-item label="状态" style="flex: 1">
            <n-switch v-model:value="form.status" :checked-value="1" :unchecked-value="0" />
          </n-form-item>
          <n-form-item label="排序" style="flex: 1">
            <n-input-number v-model:value="form.sort" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="定时发布（留空立即发布）" style="flex: 2">
            <n-date-picker v-model:value="form.publishedAt" type="datetime" clearable style="width: 100%" />
          </n-form-item>
        </n-space>

        <n-button type="primary" block :loading="saving" @click="handleSubmit">
          {{ editId ? '保存修改' : '创建消息' }}
        </n-button>
      </n-form>
    </n-modal>
  </n-card>
</template>

<style scoped>
.table-footer {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0 4px;
}
.ellipsis {
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.muted {
  color: #999;
}
.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.image-item {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}
.remove-btn {
  position: absolute;
  right: 4px;
  bottom: 4px;
}
.upload-btn {
  align-self: center;
}
</style>
