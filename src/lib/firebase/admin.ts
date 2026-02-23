import * as admin from "firebase-admin";

const isFirebaseAdminInitialized = !!process.env.FIREBASE_PROJECT_ID;

if (isFirebaseAdminInitialized && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Remove literal newline replacement if not needed depending on how environment is loaded
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export const adminAuth = isFirebaseAdminInitialized
  ? admin.auth()
  : (null as unknown as ReturnType<typeof admin.auth>);
export const adminDb = isFirebaseAdminInitialized
  ? admin.firestore()
  : (null as unknown as ReturnType<typeof admin.firestore>);
