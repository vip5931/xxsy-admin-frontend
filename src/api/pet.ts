import request from './request';

export interface PetMap {
  id: number;
  mapName: string;
  mapImage: string;
  pets: string[];
  isNew: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PetMapPayload {
  map_name: string;
  map_image?: string;
  pets?: string[];
  is_new?: number;
  sort_order?: number;
}

export function getPetsApi(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get('/pets', { params });
}

export function getPetApi(id: number) {
  return request.get(`/pets/${id}`);
}

export function createPetApi(data: PetMapPayload) {
  return request.post('/pets', data);
}

export function updatePetApi(id: number, data: Partial<PetMapPayload>) {
  return request.put(`/pets/${id}`, data);
}

export function deletePetApi(id: number) {
  return request.delete(`/pets/${id}`);
}

export function batchDeletePetsApi(ids: number[]) {
  return request.post('/pets/batch-delete', { ids });
}

export function uploadPetImageApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/pets/upload', formData, { timeout: 60000 });
}
