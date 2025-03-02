import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <h2 className="mb-4 text-2xl">Page Not Found</h2>
      <p className="mb-8 text-gray-600">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Return Home
      </Link>
    </div>
  );
} 