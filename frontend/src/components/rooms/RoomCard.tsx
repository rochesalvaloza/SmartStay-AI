import type { Room } from "../../types/room";

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
}

const roomImages: Record<string, string> = {
  deluxe:
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1000",
  family:
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1000",
  executive:
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1000",
};

function getRoomImage(roomName: string): string {
  const type = roomName.toLowerCase();

  if (type.includes("deluxe")) return roomImages.deluxe;
  if (type.includes("family")) return roomImages.family;
  if (type.includes("executive")) return roomImages.executive;

  return roomImages.deluxe;
}

export default function RoomCard({ room, onBook }: RoomCardProps) {
  const imageUrl = room.image || getRoomImage(room.name);

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-48 overflow-hidden bg-slate-100 sm:h-52">
        <img
          src={imageUrl}
          alt={`${room.name} room`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = getRoomImage(room.name);
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

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

      <div className="p-4 sm:p-5">
        <h3 className="break-words text-lg font-bold text-slate-800 transition-colors group-hover:text-violet-700 sm:text-xl">
          {room.name}
        </h3>

        <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
          {room.description || "Enjoy a comfortable stay in this room."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>👥</span>
          <span>
            Capacity: <strong>{room.capacity}</strong>{" "}
            {Number(room.capacity) === 1 ? "guest" : "guests"}
          </span>
        </div>

        <div className="mt-5 flex flex-col items-stretch gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Price per night
            </p>

            <p className="mt-1 break-words text-xl font-extrabold text-violet-700 sm:text-2xl">
              ₱{Number(room.price_per_night ?? 0).toLocaleString("en-PH")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onBook(room)}
            disabled={!room.is_available}
            className="w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none sm:w-auto"
          >
            {room.is_available ? "Book Now" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}