// auth with a settable account: currentUser is who is signed in, next is who the popup will sign in (null: the popup fails)
(globalThis.__fakeLoaded ||= []).push('auth');
export const state = globalThis.__auth = { currentUser: null, next: null, popups: 0 };
export const getAuth = () => state;
export const onAuthStateChanged = (a, cb) => { let on = true; Promise.resolve().then(() => on && cb(a.currentUser)); return () => { on = false; }; };
export class GoogleAuthProvider {}
export const signInWithPopup = async a => { a.popups++; await new Promise(r => setTimeout(r, 5)); if (!a.next) throw new Error('closed'); a.currentUser = a.next; };
export const signOut = async a => { a.currentUser = null; };
