import Link from "next/link";

export default function NotAuthorized() {
  return (
    <div style={{ padding: 24 }}>
      <h1>⚠️Not authorized⚠️</h1>
      <p>The WashXpress admin dashboard is restricted for you.</p>
      <p style={{ marginTop: 12 }}>
        <Link href="/sign-out">Sign out</Link>
      </p>
    </div>
  );
}
