import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-5 text-center">
      <p className="text-6xl font-extrabold text-violet-700">404</p>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Page Not Found
      </h1>

      <p className="mt-3 text-slate-600">
        Sorry, the page you requested could not be found.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white hover:bg-violet-800"
      >
        Back to Home
      </Link>
    </main>
  );
}
