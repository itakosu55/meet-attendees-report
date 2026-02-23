import { adminAuth } from "@/lib/firebase/admin";
import { getSessionCookie } from "@/app/actions/auth";

export async function getCurrentUser() {
  const { session, accessToken } = await getSessionCookie();

  if (!session || !adminAuth) {
    if (session && !adminAuth) {
      console.error(
        "Session exists but adminAuth is not initialized. Check FIREBASE_PROJECT_ID etc.",
      );
    }
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(session, true);
    // Note: since we used idToken in cookie directly to simulate session cookie (or if we truly use sessionCookie)
    // Actually, `verifyIdToken` is what we should use if we stored idToken as "session"
    // Let's assume we stored idToken directly as "session" for simplicity:
    // const decodedToken = await adminAuth.verifyIdToken(session);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      googleAccessToken: accessToken,
    };
  } catch (error) {
    // We stored ID token, let's try verifyIdToken
    try {
      const decodedToken = await adminAuth.verifyIdToken(session);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        googleAccessToken: accessToken,
      };
    } catch (fallbackError) {
      console.error("Token verification failed", fallbackError);
      return null;
    }
  }
}
