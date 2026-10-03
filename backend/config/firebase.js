const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const serviceAccount = require('./serviceAccountKey.json');

const app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert(serviceAccount) });

// Exports the Firebase Auth instance directly
module.exports = getAuth(app);