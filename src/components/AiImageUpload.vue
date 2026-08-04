<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { NButton, useMessage } from 'naive-ui';
import type { ImagePreviewFile } from '@/utils/image';

const files = defineModel<ImagePreviewFile[]>('files', { required: true });

const props = withDefaults(
  defineProps<{
    maxFiles?: number;
    title?: string;
    buttonLabel?: string;
    secondary?: boolean;
  }>(),
  {
    maxFiles: 5,
    title: '截图',
    buttonLabel: '选择图片',
    secondary: false,
  },
);

const message = useMessage();
const inputRef = ref<HTMLInputElement | null>(null);

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files) return;

  const next = [...files.value];
  for (const file of Array.from(target.files)) {
    if (next.length >= props.maxFiles) {
      message.warning(`最多 ${props.maxFiles} 张`);
      break;
    }
    if (!file.type.startsWith('image/')) {
      message.error('仅支持图片');
      continue;
    }
    next.push({ file, url: URL.createObjectURL(file) });
  }
  files.value = next;
  target.value = '';
}

function removeFile(index: number) {
  const item = files.value[index];
  if (item?.url) URL.revokeObjectURL(item.url);
  files.value = files.value.filter((_, i) => i !== index);
}

watch(
  files,
  (next, prev) => {
    if (next === prev) return;
    const nextUrls = new Set((next || []).map((f) => f.url));
    for (const f of prev || []) {
      if (!nextUrls.has(f.url)) URL.revokeObjectURL(f.url);
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  for (const f of files.value || []) {
    if (f.url) URL.revokeObjectURL(f.url);
  }
});
</script>

<template>
  <div>
    <div
      class="upload-zone"
      :style="{
        borderColor: files.length ? 'var(--primary-color)' : 'var(--border-color)',
      }"
    >
      <div class="upload-hint">{{ title }}，最多 {{ maxFiles }} 张</div>
      <input
        ref="inputRef"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileChange"
      />
      <n-button
        :secondary="secondary"
        :disabled="files.length >= maxFiles"
        @click="inputRef?.click()"
      >
        {{ buttonLabel }}
      </n-button>
    </div>

    <div v-if="files.length" class="preview-list">
      <div v-for="(item, idx) in files" :key="item.url" class="preview-item">
        <img :src="item.url" :alt="item.file.name" />
        <div class="preview-name">{{ item.file.name }}</div>
        <n-button size="tiny" type="error" circle @click="removeFile(idx)">×</n-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  transition: border-color 0.2s;
}

.upload-hint {
  margin-bottom: 8px;
  color: var(--text-color-secondary);
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
</style>
