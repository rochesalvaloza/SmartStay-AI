
import { useEffect, useState } from "react";
import { getRooms } from "../services/roomService";
import type { Room } from "../types/room";

const fallbackImage =
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900";

const facilities = [
  {
    icon: "📶",
    title: "Free Wi-Fi",
    description: "Stay connected throughout your visit.",
  },
  {
    icon: "🏊",
    title: "Swimming Pool",
    description: "Relax and enjoy our refreshing pool.",
  },
  {
    icon: "🍽️",
    title: "Restaurant",
    description: "Enjoy delicious meals during your stay.",
  },
  {
    icon: "🛎️",
    title: "24/7 Assistance",
    description: "Get help whenever you need it.",
  },
];

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedRooms() {
      try {
        const result = await getRooms({
          checkIn: new Date().toISOString().slice(0, 10),
          checkOut: (() => {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            return date.toISOString().slice(0, 10);
          })(),
          guests: 1,
        });

        if (!cancelled) {
          setRooms(result.rooms.slice(0, 3));
        }
      } catch (error) {
        console.error("Unable to load featured rooms:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFeaturedRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative flex min-h-[570px] items-center overflow-hidden bg-violet-950">
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=2000"
          alt="Beautiful hotel resort"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/95 via-violet-950/75 to-violet-950/20" />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-24 text-white">
          <span className="inline-block rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm backdrop-blur">
            Welcome to SmartStay
          </span>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
            Your Perfect Stay,
            <span className="block text-violet-300">Made Smarter.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-violet-100">
            Discover comfortable rooms, enjoy convenient booking, and get
            personalized assistance with SmartStay.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/rooms"
              className="rounded-xl bg-white px-7 py-3.5 font-bold text-violet-950 shadow-lg transition hover:-translate-y-1 hover:bg-violet-100"
            >
              Explore Rooms →
            </a>
            <a
              href="/rooms"
              className="rounded-xl border border-white/50 px-7 py-3.5 font-bold text-white transition hover:bg-white/10"
            >
              Book Your Stay
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-violet-100">
            <span>✓ Comfortable Accommodation</span>
            <span>✓ Easy Online Booking</span>
            <span>✓ AI-Powered Assistance</span>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="mx-auto max-w-7xl px-5 py-16 text-center">
        <p className="font-semibold uppercase tracking-widest text-violet-600">
          Welcome to SmartStay
        </p>
        <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
          A Better Way to Experience Your Stay
        </h2>
        <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-600">
          From finding the perfect accommodation to getting instant assistance,
          SmartStay makes your hotel booking experience easier and more convenient.
        </p>
      </section>

      {/* Featured Rooms */}
      <section className="bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-semibold uppercase tracking-widest text-violet-600">
                Our Accommodation
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                Explore Our Rooms
              </h2>
              <p className="mt-3 text-slate-600">
                Find a comfortable room that matches your needs and budget.
              </p>
            </div>
            <a
              href="/rooms"
              className="font-bold text-violet-700 hover:text-violet-900"
            >
              View All Rooms →
            </a>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              Loading featured rooms...
            </p>
          ) : rooms.length > 0 ? (
            <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="h-60 overflow-hidden bg-slate-100">
                    <img
                      src={room.image || fallbackImage}
                      alt={room.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900">
                      {room.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                      {room.description || "Enjoy a comfortable hotel stay."}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                      <div>
                        <p className="text-xs text-slate-500">Price per night</p>
                        <p className="text-xl font-extrabold text-violet-700">
                          ₱{Number(room.price_per_night).toLocaleString("en-PH")}
                        </p>
                      </div>
                      <span className="text-sm text-slate-500">
                        👥 {room.capacity} guests
                      </span>
                    </div>
                    <a
                      href="/rooms"
                      className="mt-5 block rounded-xl bg-violet-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-violet-800"
                    >
                      View Room
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-white p-8 text-center text-slate-500">
              No featured rooms are available right now. Please visit our Rooms page.
            </p>
          )}
        </div>
      </section>

      {/* Facilities */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="text-center">
          <p className="font-semibold uppercase tracking-widest text-violet-600">
            Hotel Facilities
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
            Everything You Need for a Great Stay
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility) => (
            <div
              key={facility.title}
              className="rounded-2xl border border-slate-200 p-6 text-center transition hover:border-violet-300 hover:shadow-lg"
            >
              <div className="text-4xl">{facility.icon}</div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {facility.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {facility.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Assistant */}
      <section className="bg-violet-950 px-5 py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="max-w-2xl">
            <p className="font-semibold uppercase tracking-widest text-violet-300">
              SmartStay AI Assistant
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Need Help Finding Your Perfect Room?
            </h2>
            <p className="mt-4 leading-7 text-violet-100">
              Get assistance with room information, hotel facilities, and
              booking procedures through our AI-powered assistant.
            </p>
          </div>
          <a
            href="/rooms"
            className="shrink-0 rounded-xl bg-white px-7 py-3.5 font-bold text-violet-950 transition hover:bg-violet-100"
          >
            Find Your Room →
          </a>
        </div>
      </section>
    </main>
  );
}
