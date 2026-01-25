"use client";
import { useClerk } from "@clerk/nextjs";

export default function SignOutPage() {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Sign out</h1>
      <button onClick={handleSignOut} style={{ padding: 12, border: "1px solid #ccc" }}>
        Sign out
      </button>
    </div>
  );
}
