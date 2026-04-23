import { base44 } from '@/api/base44Client';

async function contentWrite(entity, operation, id, data) {
  const res = await base44.functions.invoke('contentWrite', { entity, operation, id, data });
  return res.data?.result;
}

export const contentApi = {
  create: (entity, data) => contentWrite(entity, 'create', null, data),
  update: (entity, id, data) => contentWrite(entity, 'update', id, data),
  delete: (entity, id) => contentWrite(entity, 'delete', id, null),
};