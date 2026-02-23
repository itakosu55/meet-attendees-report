"use client";

import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { setSessionCookie } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Required scope to read conference records and participant sessions
      provider.addScope(
        "https://www.googleapis.com/auth/meetings.space.readonly",
      );

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleAccessToken = credential?.accessToken;

      const idToken = await result.user.getIdToken();

      if (idToken && googleAccessToken) {
        // Save to HTTP-only cookies via Server Action
        await setSessionCookie(idToken, googleAccessToken);
        router.refresh();
      } else {
        console.error("Failed to get tokens");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      サインイン (Google Meet 連携)
    </Button>
  );
}
