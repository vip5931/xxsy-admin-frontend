<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NButton,
  NImage,
  useMessage,
} from 'naive-ui';
import { createPetApi, updatePetApi, getPetApi, uploadPetImageApi } from '@/api/pet';

const props = defineProps<{ petId: number | null }>();
const emit = defineEmits(['close']);
const message = useMessage();

const form = ref({
  map_name: '',
  map_image: '',
  pets: [] as string[],
  is_new: false,
  sort_order: 0,
});
const loading = ref(false);
const uploading = ref(false);
const isEdit = ref(false);
const uploadInput = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  if (props.petId) {
    isEdit.value = true;
    try {
      const res: any = await getPetApi(props.petId);
      const p = res.data;
      form.value = {
        map_name: p.mapName || '',
        map_image: p.mapImage || '',
        pets: Array.isArray(p.pets) ? p.pets : [],
        is_new: !!p.isNew,
        sort_order: p.sortOrder || 0,
      };
    } catch (e: any) {
      message.error(e?.response?.data?.message || '加载捉宠数据失败');
      emit('close');
    }
  }
});

function addPet() {
  form.value.pets.push('');
}

function removePet(index: number) {
  form.value.pets.splice(index, 1);
}

async function handleUploadFile(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    message.error('仅支持图片文件');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    message.error('图片大小不能超过 10MB');
    return;
  }
  uploading.value = true;
  try {
    const res: any = await uploadPetImageApi(file);
    form.value.map_image = res?.data?.url || res?.url || '';
    message.success('图片已上传到阿里云 OSS');
  } catch (e: any) {
    message.error(e?.response?.data?.message || '图片上传失败，请检查后端 OSS 配置');
  } finally {
    uploading.value = false;
  }
}

async function handleSubmit() {
  if (!form.value.map_name.trim()) {
    message.warning('请输入地图名称');
    return;
  }
  const payload = {
    map_name: form.value.map_name.trim(),
    map_image: form.value.map_image.trim() || undefined,
    pets: form.value.pets.map((p) => p.trim()).filter(Boolean),
    is_new: form.value.is_new ? 1 : 0,
    sort_order: form.value.sort_order || 0,
  };
  loading.value = true;
  try {
    if (isEdit.value) {
      await updatePetApi(props.petId!, payload);
    } else {
      await createPetApi(payload);
    }
    message.success(isEdit.value ? '更新成功' : '创建成功');
    emit('close');
  } catch (e: any) {
    message.error(e?.response?.data?.message || '操作失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <n-form :model="form">
    <n-form-item label="地图名称" required>
      <n-input v-model:value="form.map_name" placeholder="如：浅水侠" />
    </n-form-item>

    <n-form-item label="地图图片">
      <div class="image-field">
        <n-image
          v-if="form.map_image"
          :src="form.map_image"
          :preview-src="form.map_image"
          width="160"
          height="90"
          object-fit="cover"
          class="img-preview"
        />
        <input
          ref="uploadInput"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleUploadFile"
        />
        <div class="img-actions">
          <n-button size="small" :loading="uploading" @click="uploadInput?.click()">
            {{ uploading ? '上传中...' : form.map_image ? '更换图片' : '上传图片' }}
          </n-button>
          <n-button
            v-if="form.map_image"
            size="small"
            type="error"
            tertiary
            @click="form.map_image = ''"
          >
            移除
          </n-button>
        </div>
        <n-input
          v-model:value="form.map_image"
          placeholder="或直接粘贴图片 URL（阿里云 OSS 地址）"
        />
      </div>
    </n-form-item>

    <n-form-item label="宠物列表">
      <div class="pets-field">
        <div v-for="(_, idx) in form.pets" :key="idx" class="pet-row">
          <n-input v-model:value="form.pets[idx]" placeholder="宠物名称" />
          <n-button size="small" type="error" tertiary @click="removePet(idx)">删除</n-button>
        </div>
        <n-button size="small" secondary @click="addPet">+ 添加宠物</n-button>
      </div>
    </n-form-item>

    <n-form-item label="是否新地图">
      <n-switch v-model:value="form.is_new" />
    </n-form-item>

    <n-form-item label="排序">
      <n-input-number
        v-model:value="form.sort_order"
        :min="0"
        style="width: 100%"
        placeholder="数值越小越靠前"
      />
    </n-form-item>

    <n-button type="primary" block :loading="loading" @click="handleSubmit">
      {{ isEdit ? '保存修改' : '创建捉宠' }}
    </n-button>
  </n-form>
</template>

<style scoped>
.image-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.img-preview {
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.img-actions {
  display: flex;
  gap: 8px;
}

.pets-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.pet-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
