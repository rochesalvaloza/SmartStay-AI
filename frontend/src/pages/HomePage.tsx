export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 px-5 py-20 text-white md:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
            Smart hotel booking powered by AI
          </p>

          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Your Perfect Stay, Made Smarter.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-violet-100">
            Discover comfortable rooms, compare your options, and plan your
            next stay with help from SmartStay AI.
          </p>

          <a
            href="/rooms"
            className="mt-8 inline-block rounded-xl bg-white px-6 py-3 font-bold text-violet-900 transition hover:bg-violet-100"
          >
            Explore Rooms
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-12 md:grid-cols-3 md:py-16">
        <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold">Comfortable Rooms</h2>
          <p className="mt-3 text-slate-600">
            Explore rooms suited to your travel needs and budget.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold">Easy Booking</h2>
          <p className="mt-3 text-slate-600">
            Choose your reservation dates, times, and number of guests.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-xl font-bold">AI Assistance</h2>
          <p className="mt-3 text-slate-600">
            Get help while exploring your accommodation options.
          </p>
        </div>
      </section>
    </main>
  );
}