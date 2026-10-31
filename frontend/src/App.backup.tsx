export default function App() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-violet-700">SmartStay AI</h1>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-16">
        <section className="rounded-2xl bg-violet-900 p-10 text-white">
          <h2 className="text-4xl font-bold">Your Perfect Stay, Made Smarter.</h2>
          <p className="mt-4 text-lg">
            Discover comfortable rooms and plan your next stay with SmartStay AI.
          </p>
          <a
            href="#rooms"
            className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-semibold text-violet-900"
          >
            Explore Rooms
          </a>
        </section>

        <section id="rooms" className="py-12">
          <h2 className="text-3xl font-bold">Rooms &amp; Accommodation</h2>
          <p className="mt-3 text-slate-600">
            Room booking will be available here.
          </p>
        </section>
      </main>

      <footer className="bg-slate-950 p-6 text-center text-white">
        SmartStay AI
      </footer>
    </div>
  );
}
