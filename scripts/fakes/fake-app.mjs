(globalThis.__fakeLoaded ||= []).push('app');   // the checker reads this to know whether a Firebase module was ever evaluated
export const initializeApp = c => ({ c });
