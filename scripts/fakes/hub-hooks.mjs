// Module resolve hook for scripts/check-hub.mjs only (scripts/fakes/hooks.mjs stays as check-cloud.mjs needs it): the cloud.js
// that hub/main.js imports becomes fake-hub-cloud.mjs, so the real hub runs under Node with no Firebase in sight. The query of
// the hub's url (?n) goes on to the fake, so each load of main.js gets its own fake with its own `enabled`.
const here = new URL('./', import.meta.url).href;
export async function resolve(spec, ctx, next) {
  const parent = ctx.parentURL || '';
  if (spec === '../shared/cloud.js' && /\/hub\/main\.js(\?|$)/.test(parent)) return { url: here + 'fake-hub-cloud.mjs' + (parent.includes('?') ? '?' + parent.split('?')[1] : ''), shortCircuit: true };
  return next(spec, ctx);
}
