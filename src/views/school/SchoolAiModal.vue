<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  NModal,
  NButton,
  NSpace,
  NSelect,
  NTable,
  NInput,
  NInputNumber,
  NPopconfirm,
  useMessage,
} from 'naive-ui';
import { aiRecognizeSchoolApi, batchCreateSchoolApi } from '@/api/school';
import AiImageUpload from '@/components/AiImageUpload.vue';
import type { ImagePreviewFile } from '@/utils/image';

const props = defineProps<{
  visible: boolean;
  servers: string[];
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const message = useMessage();
const state = ref<'select' | 'recognizing' | 'review'>('select');
const loading = ref(false);
const submitting = ref(false);
const selectedServer = ref<string | null>(null);
const filePreviews = ref<ImagePreviewFile[]>([]);
const tableData = ref<
  { serverName: string; name: string; masterName: string; power: number }[]
>([]);

watch(
  () => props.visible,
  (v) => {
    if (!v) {
      state.value = 'select';
      filePreviews.value = [];
      tableData.value = [];
      selectedServer.value = null;
    }
  },
);

async function handleRecognize() {
  if (filePreviews.value.length === 0) {
    message.warning('请先选择门派榜单截图');
    return;
  }
  loading.value = true;
  state.value = 'recognizing';
  try {
    const formData = new FormData();
    filePreviews.value.forEach((f) => formData.append('files', f.file));
    const res: any = await aiRecognizeSchoolApi(formData);
    if (res.error) throw new Error(res.error);
    const list = res.data?.list || res.list || [];
    tableData.value = list.map((item: any) => ({
      serverName: selectedServer.value || '',
      name: item.name || '未知门派',
      masterName: item.master_name || '未知',
      power: item.power || 0,
    }));
    if (tableData.value.length === 0) {
      message.warning('未能识别出任何门派排行数据');
      state.value = 'select';
    } else {
      message.success(`识别完成，共 ${tableData.value.length} 条门派排行数据`);
      state.value = 'review';
    }
  } catch (e: any) {
    message.error(e?.message || '识别失败');
    state.value = 'select';
  } finally {
    loading.value = false;
  }
}

function handleAddRow() {
  tableData.value.push({
    serverName: selectedServer.value || '',
    name: '',
    masterName: '',
    power: 0,
  });
}

function handleRemoveRow(index: number) {
  tableData.value.splice(index, 1);
}

async function handleSubmit() {
  if (!tableData.value.length) {
    message.error('没有可提交的数据');
    return;
  }
  submitting.value = true;
  try {
    await batchCreateSchoolApi(
      tableData.value.map((row) => ({
        server: row.serverName || selectedServer.value || '',
        name: row.name || '未知门派',
        master_name: row.masterName || undefined,
        power: row.power || 0,
      })),
    );
    message.success(`成功提交 ${tableData.value.length} 条门派排行数据`);
    emit('success');
    emit('close');
  } catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '提交失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <n-modal
    :show="visible"
    preset="card"
    title="AI 识别门派排行数据"
    style="width: 960px; max-width: 96vw"
    :mask-closable="false"
    @update:show="(v: boolean) => !v && emit('close')"
  >
    <div v-if="state === 'select' || state === 'recognizing'">
      <n-space vertical size="medium">
        <div>
          <span style="font-size: 14px; color: var(--text-color-secondary); margin-right: 8px">
            目标区服：
          </span>
          <n-select
            v-model:value="selectedServer"
            :options="servers.map((s) => ({ label: s, value: s }))"
            placeholder="选择区服（可选）"
            clearable
            style="width: 240px"
          />
        </div>

        <div style="font-size: 13px; color: var(--text-color-secondary)">
          上传<strong>门派榜单</strong>截图
        </div>

        <AiImageUpload
          v-model:files="filePreviews"
          title="门派榜单截图"
          button-label="选择图片"
        />

        <n-button
          type="primary"
          :loading="loading"
          :disabled="filePreviews.length === 0"
          block
          @click="handleRecognize"
        >
          {{ loading ? '识别中...' : '开始识别' }}
        </n-button>
      </n-space>
    </div>

    <div v-else-if="state === 'review'">
      <n-space vertical size="medium">
        <div class="table-toolbar">
          <n-button size="small" @click="handleAddRow">新增一行</n-button>
          <n-space>
            <span style="font-size: 13px; color: var(--text-color-secondary)">
              共 {{ tableData.length }} 条
            </span>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">
              提交数据
            </n-button>
          </n-space>
        </div>

        <n-table :single-line="false" size="small">
          <thead>
            <tr>
              <th style="width: 40px">#</th>
              <th style="width: 160px">区服</th>
              <th>门派名称</th>
              <th style="width: 130px">帮主</th>
              <th style="width: 130px">战力</th>
              <th style="width: 70px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in tableData" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>
                <n-input v-model:value="row.serverName" size="small" placeholder="区服" />
              </td>
              <td>
                <n-input v-model:value="row.name" size="small" placeholder="门派名称" />
              </td>
              <td>
                <n-input v-model:value="row.masterName" size="small" placeholder="帮主" />
              </td>
              <td>
                <n-input-number
                  v-model:value="row.power"
                  size="small"
                  :min="0"
                  style="width: 100%"
                />
              </td>
              <td>
                <n-popconfirm @positive-click="() => handleRemoveRow(idx)">
                  <template #trigger>
                    <n-button size="tiny" type="error">删除</n-button>
                  </template>
                  确定删除？
                </n-popconfirm>
              </td>
            </tr>
          </tbody>
        </n-table>

        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <n-button @click="emit('close')">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">
            提交数据
          </n-button>
        </div>
      </n-space>
    </div>
  </n-modal>
</template>

<style scoped>
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
