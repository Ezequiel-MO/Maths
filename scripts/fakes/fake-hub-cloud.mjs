// The cloud.js of the hub checker: each export hands over to globalThis.__hubCloud, which check-hub.mjs sets before every load
// of hub/main.js and which says what the cloud answers. `enabled` is read once per load, as the real one is.
const c = globalThis.__hubCloud;
c.loaded = true;
export const enabled = c.enabled;
export const session = (...a) => globalThis.__hubCloud.session(...a);
export const signIn = (...a) => globalThis.__hubCloud.signIn(...a);
export const signOut = (...a) => globalThis.__hubCloud.signOut(...a);
export const syncAll = (...a) => globalThis.__hubCloud.syncAll(...a);
