import type { Room } from "../../types/room";

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
}

export default function RoomCard({ room, onBook }: RoomCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {room.image && (
        <img
          src={room.image}
          alt={room.name}
          className="h-48 w-full object-cover"
        />
      )}

      <div className="p-5">
        <h3 className="text-xl font-bold text-slate-800">
          {room.name}
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          {room.description}
        </p>

        <p className="mt-3 text-lg font-bold text-violet-600">
          ₱{Number(room.price_per_night).toLocaleString("en-PH")}
          <span className="text-sm font-normal text-slate-500">
            {" "}/ night
          </span>
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Capacity: {room.capacity} guests
        </p>

        <button
          onClick={() => onBook(room)}
          disabled={!room.is_available}
          className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {room.is_available ? "Book Now" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}