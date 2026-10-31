import type { Room } from "../../types/room";

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
}

export default function RoomCard({ room, onBook }: RoomCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Room Image */}
      <div className="relative h-52 overflow-hidden bg-slate-100">
        {room.image ? (
          <img
            src={room.image}
            alt={room.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No room image available
          </div>
        )}

        {/* Availability Badge */}
        <span
          className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
            room.is_available
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {room.is_available ? "Available" : "Unavailable"}
        </span>
      </div>

      {/* Room Details */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-800 transition-colors group-hover:text-violet-700">
          {room.name}
        </h3>

        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
          {room.description || "Enjoy a comfortable stay in this room."}
        </p>

        {/* Capacity */}
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <span aria-hidden="true">👥</span>
          <span>
            Capacity: <strong>{room.capacity}</strong>{" "}
            {Number(room.capacity) === 1 ? "guest" : "guests"}
          </span>
        </div>

        {/* Price and Booking */}
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Price per night
            </p>
            <p className="mt-1 text-2xl font-extrabold text-violet-700">
              ₱{Number(room.price_per_night ?? 0).toLocaleString("en-PH")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onBook(room)}
            disabled={!room.is_available}
            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            {room.is_available ? "Book Now" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}