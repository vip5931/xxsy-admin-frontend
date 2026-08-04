<script setup lang="ts">
import {
  NMessageProvider,
  NDialogProvider,
  NConfigProvider,
  NLoadingBarProvider,
  zhCN,
  dateZhCN,
} from 'naive-ui';
import { themeOverrides } from './theme';
</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-message-provider>
        <n-dialog-provider>
          <router-view />
        </n-dialog-provider>
      </n-message-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
