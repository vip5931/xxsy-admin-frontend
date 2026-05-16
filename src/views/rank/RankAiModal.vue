<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { NModal, NCard, NButton, NSpace, NSelect, NTable, NInput, NInputNumber, NPopconfirm, NTag, NAlert, useMessage } from 'naive-ui';
import { aiRecognizeApi, batchCreateRankApi } from '@/api/rank';

const props = defineProps<{
  visible: boolean;
  servers: string[];
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const message = useMessage();
const fileInputRef = ref<HTMLInputElement | null>(null);
const doushenFileInputRef = ref<HTMLInputElement | null>(null);
const state = ref<'select' | 'recognizing' | 'review' | 'recognizing_doushen'>('select');
const loading = ref(false);
const doushenLoading = ref(false);
const submitting = ref(false);
const selectedServer = ref<string | null>(null);
const filePreviews = ref<{ file: File; url: string }[]>([]);
const doushenPreviews = ref<{ file: File; url: string }[]>([]);
const tableData = ref<{ serverName: string; roleName: string; profession: string; combatPower: number; fromDoushen?: boolean }[]>([]);

const hiddenCount = computed(() => tableData.value.filter(r => r.roleName === '玩家信息已隐藏').length);
const filledCount = computed(() => tableData.value.filter(r => r.fromDoushen).length);

watch(() => props.visible, (v) => {
  if (!v) {
    state.value = 'select';
    filePreviews.value = [];
    doushenPreviews.value = [];
    tableData.value = [];
    selectedServer.value = null;
  }
});

// ========== Image utilities ==========
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
      resolve(blob);
    }, type || 'image/png', 0.92);
  });
}

async function splitImageIntoFive(file: File): Promise<File[]> {
  const img = await loadImage(file);
  const { width, height } = img;
  const chunkHeight = Math.floor(height / 5);
  const files: File[] = [];
  for (let i = 0; i < 5; i++) {
    const startY = i * chunkHeight;
    const currentHeight = i === 4 ? height - startY : chunkHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = currentHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, startY, width, currentHeight, 0, 0, width, currentHeight);
    const blob = await canvasToBlob(canvas, file.type);
    const dotIdx = file.name.lastIndexOf('.');
    const base = dotIdx > 0 ? file.name.slice(0, dotIdx) : file.name;
    const ext = dotIdx > 0 ? file.name.slice(dotIdx) : '.png';
    files.push(new File([blob], `${base}_part_${i + 1}${ext}`, { type: blob.type || file.type || 'image/png' }));
  }
  return files;
}

// ========== 排行榜 upload ==========
function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;
  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i];
    if (filePreviews.value.length >= 5) { message.warning('最多 5 张'); break; }
    if (!file.type.startsWith('image/')) { message.error('仅支持图片'); continue; }
    filePreviews.value.push({ file, url: URL.createObjectURL(file) });
  }
  target.value = '';
}

function removeFile(index: number) {
  const item = filePreviews.value[index];
  if (item.url) URL.revokeObjectURL(item.url);
  filePreviews.value.splice(index, 1);
}

// ========== 斗神榜 upload ==========
function handleDoushenFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;
  for (let i = 0; i < target.files.length; i++) {
    const file = target.files[i];
    if (doushenPreviews.value.length >= 5) { message.warning('最多 5 张'); break; }
    if (!file.type.startsWith('image/')) { message.error('仅支持图片'); continue; }
    doushenPreviews.value.push({ file, url: URL.createObjectURL(file) });
  }
  target.value = '';
}

function removeDoushenFile(index: number) {
  const item = doushenPreviews.value[index];
  if (item.url) URL.revokeObjectURL(item.url);
  doushenPreviews.value.splice(index, 1);
}

async function doRecognize(files: { file: File; url: string }[]): Promise<any[]> {
  const formData = new FormData();
  let toUpload = files.map(f => f.file);
  if (toUpload.length === 1) {
    toUpload = await splitImageIntoFive(toUpload[0]);
    message.info('检测到单张图片，已自动裁切为 5 张后上传');
  }
  toUpload.forEach(file => formData.append('files', file));
  const res: any = await aiRecognizeApi(formData);
  if (res.error) throw new Error(res.error);
  const list = res.data?.list || res.list || [];
  return list.map((item: any) => ({
    roleName: item.role_name || '玩家信息已隐藏',
    profession: item.profession || '未知职业',
    combatPower: item.combat_power || 0,
  }));
}

// ========== 识别排行榜 ==========
async function handleRecognize() {
  if (filePreviews.value.length === 0) { message.warning('请先选择排行榜截图'); return; }
  loading.value = true;
  state.value = 'recognizing';
  try {
    const rows = await doRecognize(filePreviews.value);
    tableData.value = rows.map(r => ({
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
      const hidden = tableData.value.filter(r => r.roleName === '玩家信息已隐藏').length;
      message.success(`识别完成，共 ${tableData.value.length} 条（${hidden} 条隐藏名称）`);
      state.value = 'review';
    }
  } catch (e: any) {
    message.error(e?.message || '识别失败');
    state.value = 'select';
  } finally { loading.value = false; }
}

// ========== 识别斗神榜并合并 ==========
async function handleRecognizeDoushen() {
  if (doushenPreviews.value.length === 0) { message.warning('请先选择斗神榜截图'); return; }
  doushenLoading.value = true;
  state.value = 'recognizing_doushen';
  try {
    const doushenRows = await doRecognize(doushenPreviews.value);

    // Build lookup map: combatPower → name
    const nameMap = new Map<number, string>();
    for (const r of doushenRows) {
      if (r.roleName && r.roleName !== '玩家信息已隐藏') {
        nameMap.set(r.combatPower, r.roleName);
      }
    }

    // Merge: replace hidden names by matching combat power
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

    doushenPreviews.value.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
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
  } finally { doushenLoading.value = false; }
}

// ========== Table operations ==========
function handleAddRow() {
  tableData.value.push({ serverName: selectedServer.value || '', roleName: '', profession: '', combatPower: 0, fromDoushen: false });
}

function handleRemoveRow(index: number) {
  tableData.value.splice(index, 1);
}

// ========== Batch submit ==========
async function handleSubmit() {
  if (!tableData.value.length) { message.error('没有可提交的数据'); return; }
  submitting.value = true;
  try {
    await batchCreateRankApi(
      tableData.value.map(row => ({
        server_name: row.serverName || selectedServer.value || '',
        role_name: row.roleName || '玩家信息已隐藏',
        profession: row.profession || undefined,
        combat_power: row.combatPower || 0,
      }))
    );
    message.success(`成功提交 ${tableData.value.length} 条排行数据`);
    emit('success');
    emit('close');
  } catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || '提交失败');
  } finally { submitting.value = false; }
}
</script>

<template>
  <n-modal
    :show="visible"
    preset="card"
    title="AI 识别排行榜数据"
    style="width: 960px; max-width: 96vw"
    :mask-closable="false"
    @update:show="(v: boolean) => !v && emit('close')"
  >
    <!-- ============ Step 1: Upload 排行榜 ============ -->
    <div v-if="state === 'select' || state === 'recognizing'">
      <n-space vertical size="medium">
        <div>
          <span style="font-size: 14px; color: var(--text-color-secondary); margin-right: 8px">目标区服：</span>
          <n-select
            v-model:value="selectedServer"
            :options="servers.map(s => ({ label: s, value: s }))"
            placeholder="选择区服（可选）"
            clearable
            style="width: 240px"
          />
        </div>

        <div style="font-size: 13px; color: var(--text-color-secondary)">第一步：上传<strong>排行榜</strong>截图（战力榜/排行）</div>

        <div class="upload-zone" :style="{ borderColor: filePreviews.length ? 'var(--primary-color)' : 'var(--border-color)' }">
          <div style="margin-bottom: 8px; color: var(--text-color-secondary)">排行榜截图，最多 5 张</div>
          <input type="file" accept="image/*" multiple style="display: none" ref="fileInputRef" @change="handleFileChange" />
          <n-button @click="fileInputRef?.click()" :disabled="filePreviews.length >= 5">选择图片</n-button>
        </div>

        <div v-if="filePreviews.length" class="preview-list">
          <div v-for="(item, idx) in filePreviews" :key="idx" class="preview-item">
            <img :src="item.url" :alt="item.file.name" />
            <div class="preview-name">{{ item.file.name }}</div>
            <n-button size="tiny" type="error" circle @click="removeFile(idx)">✕</n-button>
          </div>
        </div>

        <n-button type="primary" :loading="loading" :disabled="filePreviews.length === 0" block @click="handleRecognize">
          {{ loading ? '识别中...' : '开始识别排行榜' }}
        </n-button>
      </n-space>
    </div>

    <!-- ============ Step 2: Review + 斗神榜补充 ============ -->
    <div v-else-if="state === 'review' || state === 'recognizing_doushen'">
      <n-space vertical size="medium">
        <!-- Stats -->
        <n-alert v-if="hiddenCount > 0" type="warning" :show-icon="false" style="margin-bottom: 0">
          还有 <strong>{{ hiddenCount }}</strong> 条隐藏名称未补充，可上传「斗神榜」截图通过战力匹配自动填充真实名称
        </n-alert>

        <!-- 斗神榜 upload area -->
        <div v-if="hiddenCount > 0" class="doushen-section">
          <div style="font-size: 13px; color: var(--text-color-secondary); margin-bottom: 8px">第二步：上传<strong>斗神榜</strong>截图（含不隐藏名字的榜）补充真实名称</div>

          <div class="upload-zone doushen-zone" :style="{ borderColor: doushenPreviews.length ? '#f0a020' : 'var(--border-color)' }">
            <div style="margin-bottom: 8px; color: var(--text-color-secondary)">斗神榜截图，最多 5 张</div>
            <input type="file" accept="image/*" multiple style="display: none" ref="doushenFileInputRef" @change="handleDoushenFileChange" />
            <n-button @click="doushenFileInputRef?.click()" :disabled="doushenPreviews.length >= 5" secondary>
              选择斗神榜图片
            </n-button>
          </div>

          <div v-if="doushenPreviews.length" class="preview-list">
            <div v-for="(item, idx) in doushenPreviews" :key="'d'+idx" class="preview-item">
              <img :src="item.url" :alt="item.file.name" />
              <div class="preview-name">{{ item.file.name }}</div>
              <n-button size="tiny" type="error" circle @click="removeDoushenFile(idx)">✕</n-button>
            </div>
          </div>

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

        <!-- Result table -->
        <div class="table-toolbar">
          <n-space>
            <n-button size="small" @click="handleAddRow">新增一行</n-button>
            <n-tag v-if="filledCount > 0" type="success" size="small">已补充 {{ filledCount }} 条</n-tag>
          </n-space>
          <n-space>
            <span style="font-size: 13px; color: var(--text-color-secondary)">共 {{ tableData.length }} 条</span>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">提交数据</n-button>
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
            <tr v-for="(row, idx) in tableData" :key="idx" :style="{ background: row.fromDoushen ? 'rgba(24, 160, 88, 0.06)' : '' }">
              <td>{{ idx + 1 }}</td>
              <td><n-input v-model:value="row.serverName" size="small" placeholder="区服" /></td>
              <td>
                <n-space :size="6" align="center">
                  <n-input v-model:value="row.roleName" size="small" placeholder="角色名" :style="{ width: '140px' }" />
                  <n-tag v-if="row.fromDoushen" type="success" size="tiny" :bordered="false">斗神补</n-tag>
                </n-space>
              </td>
              <td><n-input v-model:value="row.profession" size="small" placeholder="职业" /></td>
              <td><n-input-number v-model:value="row.combatPower" size="small" :min="0" style="width: 100%" /></td>
              <td>
                <n-popconfirm @positive-click="() => handleRemoveRow(idx)">
                  <template #trigger><n-button size="tiny" type="error">删除</n-button></template>
                  确定删除？
                </n-popconfirm>
              </td>
            </tr>
          </tbody>
        </n-table>

        <div style="display: flex; justify-content: flex-end; gap: 8px">
          <n-button @click="emit('close')">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">提交数据</n-button>
        </div>
      </n-space>
    </div>
  </n-modal>
</template>

<style scoped>
.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 28px;
  text-align: center;
  transition: border-color 0.2s;
}

.doushen-zone {
  border-style: dashed;
  border-color: #f0a020;
  background: rgba(240, 160, 32, 0.03);
}

.doushen-section {
  background: rgba(240, 160, 32, 0.04);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(240, 160, 32, 0.2);
}

.preview-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-item {
  position: relative;
  width: 100px;
}

.preview-item img {
  width: 100px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.preview-name {
  font-size: 11px;
  color: var(--text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.preview-item .n-button {
  position: absolute;
  top: -6px;
  right: -6px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
