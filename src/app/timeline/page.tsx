import Link from "next/link";

export default function TimelinePage() {
  return (
    <div className="bg-white min-h-screen flex items-center justify-center">
      <Link
        href="/dashboard"
        className="bg-black text-white px-6 py-3 rounded-lg shadow hover:bg-gray-800 transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}