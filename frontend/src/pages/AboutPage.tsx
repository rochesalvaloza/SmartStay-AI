const values = [
  {
    icon: "💜",
    title: "Guest First",
    description:
      "We prioritize guest comfort and satisfaction in every part of the booking experience.",
  },
  {
    icon: "✨",
    title: "Innovation",
    description:
      "We use smart technology and AI assistance to make hotel booking easier.",
  },
  {
    icon: "🤝",
    title: "Trust and Security",
    description:
      "We value customer privacy and work to keep booking information secure.",
  },
  {
    icon: "🌟",
    title: "Quality Service",
    description:
      "We aim to provide a smooth, reliable, and welcoming experience.",
  },
];

const services = [
  {
    icon: "🛏️",
    title: "Comfortable Rooms",
    description: "Explore room options for solo travelers, families, and business guests.",
  },
  {
    icon: "📅",
    title: "Easy Reservations",
    description: "Check room availability and book your preferred dates conveniently.",
  },
  {
    icon: "🤖",
    title: "AI Assistance",
    description: "Get quick answers to common questions with our AI-powered assistant.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      {/* Hero */}
      <section className="relative flex min-h-[360px] items-center overflow-hidden bg-violet-950">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800"
          alt="Beautiful hotel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/95 via-violet-950/75 to-violet-950/30" />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-violet-200">
            Get to Know Us
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl md:text-6xl">
            About <span className="text-violet-300">SmartStay</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-violet-100 sm:text-lg">
            Making hotel reservations simpler, smarter, and more convenient
            through technology and personalized assistance.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            Who We Are
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            A Smarter Way to Plan Your Stay
          </h2>
          <p className="mt-6 leading-8 text-slate-600">
            SmartStay is a hotel booking platform designed to make finding
            and reserving accommodation more convenient. Guests can explore
            available rooms, compare prices, and manage their reservations in
            one place.
          </p>
          <p className="mt-4 leading-8 text-slate-600">
            With AI-powered assistance, customers can also get quick answers
            to common hotel questions and receive help while planning their
            stay.
          </p>
          <a
            href="/rooms"
            className="mt-7 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Explore Our Rooms
          </a>
        </div>

        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200"
            alt="Comfortable hotel room"
            className="h-[340px] w-full rounded-3xl object-cover shadow-xl sm:h-[420px]"
          />
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="bg-white px-5 py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-violet-50 p-8 sm:p-10">
            <div className="text-4xl">🎯</div>
            <h2 className="mt-5 text-2xl font-extrabold text-violet-900">
              Our Mission
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              To provide a convenient and user-friendly hotel booking
              experience through reliable reservation tools, accessible
              information, and AI-powered customer assistance.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-900 p-8 text-white sm:p-10">
            <div className="text-4xl">🔭</div>
            <h2 className="mt-5 text-2xl font-extrabold text-violet-300">
              Our Vision
            </h2>
            <p className="mt-4 leading-8 text-slate-300">
              To make hotel reservations smarter and more accessible by
              combining hospitality with modern technology and secure
              digital services.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="mx-auto max-w-7xl px-5 py-16 md:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            What Guides Us
          </p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            Our Core Values
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            The principles behind the experience we want every guest to have.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">{value.icon}</div>
              <h3 className="mt-5 text-lg font-bold">{value.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-white px-5 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              What We Offer
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Making Every Step Easier
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-2xl border border-slate-200 p-7 transition hover:border-violet-300 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-3xl">
                  {service.icon}
                </div>
                <h3 className="mt-5 text-xl font-bold">{service.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-violet-950 to-indigo-900 px-5 py-16 text-center text-white md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            Ready to Find Your Perfect Stay?
          </h2>
          <p className="mt-4 leading-7 text-violet-100">
            Explore our available rooms and enjoy a simpler hotel booking
            experience with SmartStay AI.
          </p>
          <a
            href="/rooms"
            className="mt-8 inline-flex rounded-xl bg-white px-7 py-3 font-bold text-violet-900 transition hover:bg-violet-100"
          >
            Book Your Stay
          </a>
        </div>
      </section>
    </main>
  );
}