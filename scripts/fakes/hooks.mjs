// Module resolve hook for scripts/check-cloud.mjs: the three Firebase packages and the config become small in-memory fakes,
// so the real shared/cloud.js runs under Node with no Firebase package loaded. A cloud.js imported with `?null` gets the real
// firebase-config.js (null), to see what the inert path does.
const here = new URL('./', import.meta.url).href;
const FAKES = { 'firebase/app': 'fake-app.mjs', 'firebase/auth': 'fake-auth.mjs', 'firebase/firestore/lite': 'fake-fs.mjs' };
export async function resolve(spec, ctx, next) {
  if (FAKES[spec]) return { url: here + FAKES[spec], shortCircuit: true };
  if (spec === './firebase-config.js' && !(ctx.parentURL || '').endsWith('?null')) return { url: here + 'fake-config.mjs', shortCircuit: true };
  return next(spec, ctx);
}
