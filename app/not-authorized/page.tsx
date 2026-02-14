import Link from "next/link";

export default function NotAuthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 max-w-md w-full text-center">
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          You are not authorized
        </h1>

        {/* Description */}
        <p className="text-slate-500 mb-8">
          You don&apos;t have permission to login to WashXpress admin portal.
        </p>

        {/* Sign Out Button */}
        <Link
          href="/sign-out"
          className="inline-block px-8 py-3 rounded-xl border-2 border-slate-800 text-red-500 font-semibold hover:bg-slate-50 transition-colors"
        >
          sign out
        </Link>
      </div>
    </div>
  );
}
