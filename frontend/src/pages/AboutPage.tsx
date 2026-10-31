
export default function AboutPage() {
  return (
    <main className="min-h-[70vh] bg-white">
      <section className="bg-gradient-to-br from-violet-950 via-violet-900 to-indigo-900 px-5 py-20 text-center text-white">
        <p className="font-semibold uppercase tracking-[0.2em] text-violet-200">
          About Us
        </p>

        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
          Welcome to SmartStay AI
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-violet-100">
          Making hotel room discovery and booking easier through a simple,
          modern, AI-assisted experience.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-3xl font-extrabold text-slate-900">
          A Smarter Way to Plan Your Stay
        </h2>

        <p className="mt-5 max-w-3xl leading-7 text-slate-600">
          SmartStay AI is a hotel booking system designed to help users explore
          rooms, review prices, select reservation dates, and submit booking
          requests in one convenient place.
        </p>

        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
          The system also includes an AI assistant to help users explore
          accommodation options and navigate the booking process.
        </p>

        <div className="mt-10 rounded-2xl bg-violet-50 p-8">
          <h3 className="text-xl font-bold text-slate-900">Our Goals</h3>

          <ul className="mt-4 list-inside list-disc space-y-3 text-slate-700">
            <li>Make room reservations simple and convenient.</li>
            <li>Provide helpful AI-assisted guidance.</li>
            <li>Offer a clear, user-friendly booking experience.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
