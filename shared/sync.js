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
