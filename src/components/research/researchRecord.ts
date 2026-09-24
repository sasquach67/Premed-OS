export const envelope = () => ({ id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now(), archived: false, order: Date.now() })
