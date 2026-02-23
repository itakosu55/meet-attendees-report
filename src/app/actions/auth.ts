"use server";

import { cookies } from "next/headers";

export async function setSessionCookie(idToken: string, accessToken: string) {
  const cookieStore = await cookies();
  cookieStore.set("session", idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 5, // 5 days
    path: "/",
  });

  // also store google access token
  cookieStore.set("google_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60, // 1 hour typically for google access token
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("google_access_token");
}

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return {
    session: cookieStore.get("session")?.value,
    accessToken: cookieStore.get("google_access_token")?.value,
  };
}
