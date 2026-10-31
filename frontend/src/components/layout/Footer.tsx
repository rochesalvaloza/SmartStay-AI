export default function Footer() {
  return (
    <footer className="mt-16 bg-slate-950 px-6 py-8 text-center text-white">
      <h2 className="text-xl font-bold text-violet-300">SmartStay AI</h2>

      <p className="mt-2 text-sm text-slate-300">
        Your perfect stay, made smarter.
      </p>

      <p className="mt-5 text-xs text-slate-400">
        © {new Date().getFullYear()} SmartStay AI. All rights reserved.
      </p>
    </footer>
  );
}