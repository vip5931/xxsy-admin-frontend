<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import {
  NModal,
  NButton,
  NSpace,
  NSelect,
  NTable,
  NInput,
  NInputNumber,
  NPopconfirm,
  NTag,
  NAlert,
  useMessage,
} from 'naive-ui';
import { aiRecognizeApi, batchCreateRankApi } from '@/api/rank';
import AiImageUpload from '@/components/AiImageUpload.vue';
import { splitImageIntoFive } from '@/utils/image';
import type { ImagePreviewFile } from '@/utils/image';
import { AI_MODEL_OPTIONS, DEFAULT_AI_MODEL } from '@/utils/aiModels';

const props = defineProps<{
  visible: boolean;
  servers: string[];
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const message = useMessage();
const state = ref<'select' | 'recognizing' | 'review' | 'recognizing_doushen'>('select');
const loading = ref(false);
const doushenLoading = ref(false);
const submitting = ref(false);
const selectedServer = ref<string | null>(null);
const selectedModel = ref<string>(DEFAULT_AI_MODEL);
const filePreviews = ref<ImagePreviewFile[]>([]);
const doushenPreviews = ref<ImagePreviewFile[]>([]);
const tableData = ref<
  { serverName: string; roleName: string; profession: string; combatPower: number; fromDoushen?: boolean }[]
>([]);

const hiddenCount = computed(() =>
  tableData.value.filter((r) => r.roleName === '玩家信息已隐藏').length,
);
const filledCount = computed(() => tableData.value.filter((r) => r.fromDoushen).length);

watch(
  () => props.visible,
  (v) => {
    if (!v) {
      state.value = 'select';
      filePreviews.value = [];
      doushenPreviews.value = [];
      tableData.value = [];
      selectedServer.value = null;
      selectedModel.value = DEFAULT_AI_MODEL;
    }
  },
);

async function doRecognize(files: ImagePreviewFile[]): Promise<any[]> {
  const formData = new FormData();
  let toUpload = files.map((f) => f.file);
  if (toUpload.length === 1) {
    toUpload = await splitImageIntoFive(toUpload[0]);
    message.info('检测到单张图片，已自动裁剪为 5 张后上传');
  }
  toUpload.forEach((file) => formData.append('files', file));
  formData.append('model', selectedModel.value);
  const res: any = await aiRecognizeApi(formData);
  if (res.error) throw new Error(res.error);
  const list = res.data?.list || res.list || [];
  return list.map((item: any) => ({
    roleName: item.role_name || '玩家信息已隐藏',
    profession: item.profession || '未知职业',
    combatPower: item.combat_power || 0,
  }));
}

async function handleRecognize() {
  if (filePreviews.value.length === 0) {
    message.warning('请先选择排行截图');
    return;
  }
  loading.value = true;
  state.value = 'recognizing';
  const expectedRows = filePreviews.value.length === 1 ? 100 : filePreviews.value.length * 20;
  try {
    const rows = await doRecognize(filePreviews.value);
    tableData.value = rows.map((r) => ({
      serverName: selectedServer.value || '',
      roleName: r.roleName,
      profession: r.profession,
      combatPower: r.combatPower,
      fromDoushen: false,
    }));
    if (tableData.value.length === 0) {
      message.warning('未能识别出任何角色数据');
      state.value = 'select';
    } else {
      const hidden = tableData.value.filter((r) => r.roleName === '玩家信息已隐藏').length;
      if (tableData.value.length < expectedRows) {
        message.warning(
          `识别完成，共 ${tableData.value.length} 条（${hidden} 条隐藏名称），少于预期约 ${expectedRows} 条，可能未完全提取，可尝试切换其他模型重新识别`,
        );
      } else {
        message.success(`识别完成，共 ${tableData.value.length} 条（${hidden} 条隐藏名称）`);
      }
      state.value = 'review';
    }
  } catch (e: any) {
    message.error(e?.message || '识别失败');
    state.value = 'select';
  } finally {
    loading.value = false;
  }
}

async function handleRecognizeDoushen() {
  if (doushenPreviews.value.length === 0) {
    message.warning('请先选择斗神榜截图');
    return;
  }
  doushenLoading.value = true;
  state.value = 'recognizing_doushen';
  try {
    const doushenRows = await doRecognize(doushenPreviews.value);

    const nameMap = new Map<number, string>();
    for (const r of doushenRows) {
      if (r.roleName && r.roleName !== '玩家信息已隐藏') {
        nameMap.set(r.combatPower, r.roleName);
      }
    }

    let filled = 0;
    for (const row of tableData.value) {
      if (row.roleName === '玩家信息已隐藏') {
        const realName = nameMap.get(row.combatPower);
        if (realName) {
          row.roleName = realName;
          row.fromDoushen = true;
          filled++;
        }
      }
    }

    doushenPreviews.value = [];

    if (filled > 0) {
      message.success(`斗神榜匹配成功，补充了 ${filled} 条隐藏名称`);
    } else {
      message.warning('斗神榜识别完成，但没有匹配到隐藏名称（战力不一致）');
    }
    state.value = 'review';
  } catch (e: any) {
    message.error(e?.message || '斗神榜识别失败');
    state.value = 'review';
  } finally {
    doushenLoading.value = false;
  }
}

function handleAddRow() {
  tableData.value.push({
    serverName: selectedServer.value || '',
    roleName: '',
    profession: '',
    combatPower: 0,
    fromDoushen: false,
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
    await batchCreateRankApi(
      tableData.value.map((row) => ({
        server_name: row.serverName || selectedServer.value || '',
        role_name: row.roleName || '玩家信息已隐藏',
        profession: row.profession || undefined,
        combat_power: row.combatPower || 0,
      })),
    );
    message.success(`成功提交 ${tableData.value.length} 条排行数据`);
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
    title="AI 识别排行数据"
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

        <div>
          <span style="font-size: 14px; color: var(--text-color-secondary); margin-right: 8px">
            识别模型：
          </span>
          <n-select
            v-model:value="selectedModel"
            :options="AI_MODEL_OPTIONS.map((m) => ({ label: m.label, value: m.id }))"
            style="width: 340px"
          />
        </div>

        <div style="font-size: 13px; color: var(--text-color-secondary)">
          第一步：上传<strong>排行榜</strong>截图（战力榜/排行）
        </div>

        <AiImageUpload v-model:files="filePreviews" title="排行截图" button-label="选择图片" />

        <n-button
          type="primary"
          :loading="loading"
          :disabled="filePreviews.length === 0"
          block
          @click="handleRecognize"
        >
          {{ loading ? '识别中...' : '开始识别排行' }}
        </n-button>
      </n-space>
    </div>

    <div v-else-if="state === 'review' || state === 'recognizing_doushen'">
      <n-space vertical size="medium">
        <n-alert v-if="hiddenCount > 0" type="warning" :show-icon="false" style="margin-bottom: 0">
          还有 <strong>{{ hiddenCount }}</strong> 条隐藏名称未补充，可上传「斗神榜」截图通过战力匹配自动填充真实名称
        </n-alert>

        <div v-if="hiddenCount > 0" class="doushen-section">
          <div style="font-size: 13px; color: var(--text-color-secondary); margin-bottom: 8px">
            第二步：上传<strong>斗神榜</strong>截图（含不隐藏名字的榜）补充真实名称
          </div>

          <AiImageUpload
            v-model:files="doushenPreviews"
            title="斗神榜截图"
            button-label="选择斗神榜图片"
            secondary
          />

          <n-button
            type="warning"
            :loading="doushenLoading"
            :disabled="doushenPreviews.length === 0"
            block
            style="margin-top: 8px"
            @click="handleRecognizeDoushen"
          >
            {{ doushenLoading ? '识别斗神榜中...' : '识别斗神榜并匹配名称' }}
          </n-button>
        </div>

        <div class="table-toolbar">
          <n-space>
            <n-button size="small" @click="handleAddRow">新增一行</n-button>
            <n-tag v-if="filledCount > 0" type="success" size="small">
              已补充 {{ filledCount }} 条
            </n-tag>
          </n-space>
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
              <th>角色名</th>
              <th style="width: 110px">职业</th>
              <th style="width: 130px">战力</th>
              <th style="width: 70px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in tableData"
              :key="idx"
              :style="{ background: row.fromDoushen ? 'rgba(24, 160, 88, 0.06)' : '' }"
            >
              <td>{{ idx + 1 }}</td>
              <td>
                <n-input v-model:value="row.serverName" size="small" placeholder="区服" />
              </td>
              <td>
                <n-space :size="6" align="center">
                  <n-input
                    v-model:value="row.roleName"
                    size="small"
                    placeholder="角色名"
                    :style="{ width: '140px' }"
                  />
                  <n-tag v-if="row.fromDoushen" type="success" size="tiny" :bordered="false">
                    斗神榜
                  </n-tag>
                </n-space>
              </td>
              <td>
                <n-input v-model:value="row.profession" size="small" placeholder="职业" />
              </td>
              <td>
                <n-input-number
                  v-model:value="row.combatPower"
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
.doushen-section {
  background: rgba(240, 160, 32, 0.04);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(240, 160, 32, 0.2);
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
