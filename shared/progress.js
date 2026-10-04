// The only door to what a player has saved. Each game keeps one JSON document under its id, and today it lives in this
// browser's localStorage. A server would be reached from here, behind the same two calls, and no game would change:
// the browser's copy stays what the games read, and save() also sends it.

// what was saved under id, or null when there is nothing or it cannot be read
export function load(id) { try { return JSON.parse(localStorage.getItem(id)); } catch (e) { return null; } }
export function save(id, data) { try { localStorage.setItem(id, JSON.stringify(data)); } catch (e) {} }
