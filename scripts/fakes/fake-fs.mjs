// in-memory Firestore: path -> data. C.hook(op, path, data) (op is 'list', 'get' or 'set') may throw (a network error) or return a promise (a slow request)
// before the op happens. setDoc refuses what the real one refuses: undefined values and arrays inside arrays.
(globalThis.__fakeLoaded ||= []).push('firestore');
export const C = globalThis.__cloud = { docs: new Map(), log: [], hook: null };
const tick = () => new Promise(r => setTimeout(r, 1));
export const getFirestore = () => ({});
export const collection = (db, ...seg) => ({ path: seg.join('/') });
export const doc = (db, ...seg) => ({ path: seg.join('/') });
export const getDocs = async c => {
  await tick(); C.log.push('list ' + c.path); if (C.hook) await C.hook('list', c.path);
  const out = [];
  for (const [p, v] of C.docs) if (p.startsWith(c.path + '/') && !p.slice(c.path.length + 1).includes('/')) out.push({ id: p.slice(c.path.length + 1), data: () => structuredClone(v) });
  return { forEach: f => out.forEach(f) };
};
export const getDoc = async d => {
  await tick(); C.log.push('get ' + d.path); if (C.hook) await C.hook('get', d.path);
  const v = C.docs.get(d.path);
  return { exists: () => v !== undefined, data: () => structuredClone(v) };
};
export const setDoc = async (d, v) => {
  const chk = (x, inArr) => { if (x === undefined) throw new Error('undefined'); if (Array.isArray(x)) { if (inArr) throw new Error('nested array'); x.forEach(y => chk(y, true)); } else if (x && typeof x === 'object') Object.values(x).forEach(y => chk(y, false)); };
  chk(v, false);
  const copy = structuredClone(v);
  await tick(); C.log.push('set ' + d.path); if (C.hook) await C.hook('set', d.path, copy);
  C.docs.set(d.path, copy);
};
