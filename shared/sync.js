// Two pure rules behind the cloud copy of the progress. No document, window, localStorage or Firebase in here, so a
// checker can run them under Node.

// the id of a profile from the name typed, or '' when the name is not worth keeping
export function slug(name) {
  if (typeof name !== 'string') return '';
  const s = name.trim();
  if (s.length < 1 || s.length > 12) return '';   // limit on the name as typed, before slugging
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// what to do with one document: local is null or { at, base, pending }, remote is null or { at }
// 'push' sends the device's copy, 'pull' takes the cloud's, 'none' leaves both. base is the cloud's at when last synced,
// so a cloud still at base has not moved. If both moved, the larger at wins and a tie goes to the cloud.
export function settle(local, remote) {
  if (!local && !remote) return 'none';
  if (!remote) return 'push';
  if (!local) return 'pull';
  if (remote.at === local.base) return local.pending ? 'push' : 'none';
  if (!local.pending) return 'pull';
  return local.at > remote.at ? 'push' : 'pull';
}

// the value of an own key only: a document with a key like 'constructor' must not read what Object.prototype has
const own = (o, k) => (Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const gone = v => v === null || v === undefined;
const copy = v => (gone(v) ? v : JSON.parse(JSON.stringify(v)));

// two copies of one document into one, field by field, so neither side's progress is lost. aNewer says a is the newer copy.
// Numbers take the larger, booleans the true one, lists go position by position; a text or a type clash takes the newer.
// 'so' (sound on or off) is a choice, not progress: the newer copy's value wins, so switching it off sticks. Pure: a and b stay as they were.
export function merge(a, b, aNewer) {
  if (gone(a)) return copy(b);
  if (gone(b)) return copy(a);
  if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
  if (typeof a === 'boolean' && typeof b === 'boolean') return a || b;
  if (Array.isArray(a) && Array.isArray(b)) {
    return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => merge(a[i], b[i], aNewer));
  }
  if (isObj(a) && isObj(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    return Object.fromEntries(keys.map(k => {
      if (k === 'so') {
        const [mine, other] = aNewer ? [own(a, 'so'), own(b, 'so')] : [own(b, 'so'), own(a, 'so')];
        return [k, copy(gone(mine) ? other : mine)];
      }
      return [k, merge(own(a, k), own(b, k), aNewer)];
    }));
  }
  return copy(aNewer ? a : b);
}

// equal as JSON values, whatever the order of the keys
export function same(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => same(v, b[i]));
  if (isObj(a) && isObj(b)) {
    const ka = Object.keys(a);
    return ka.length === Object.keys(b).length && ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && same(a[k], b[k]));
  }
  return false;
}
