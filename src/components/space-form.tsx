"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SpaceForm() {
  const [meetingCode, setMeetingCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      // Navigate to the meeting space overview
      router.push(`/space/${meetingCode.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="meetingCode">会議コード (例: abc-defg-hij)</Label>
        <Input
          id="meetingCode"
          placeholder="abc-defg-hij"
          value={meetingCode}
          onChange={(e) => setMeetingCode(e.target.value)}
          required
        />
      </div>
      <Button type="submit">レポートを表示</Button>
    </form>
  );
}
