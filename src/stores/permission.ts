import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePermissionStore = defineStore('permission', () => {
  const permissions = ref<string[]>([]);

  function setPermissions(perms: string[]) {
    permissions.value = perms;
  }

  function hasPermission(code: string): boolean {
    return permissions.value.includes(code);
  }

  function clearPermissions() {
    permissions.value = [];
  }

  return { permissions, setPermissions, hasPermission, clearPermissions };
});
