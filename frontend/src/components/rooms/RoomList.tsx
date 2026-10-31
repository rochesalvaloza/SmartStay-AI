import type { Room, RoomTypeAvailability } from "../../types/room";
import RoomCard from "./RoomCard";

interface RoomListProps {
  rooms: Room[];
  onBook: (room: Room) => void;
  availability: RoomTypeAvailability[];
}

export default function RoomList({
  rooms,
  onBook,
  availability,
}: RoomListProps) {
  return (
    <div className="space-y-6">
      {/* Availability Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {availability.map((item) => (
          <div
            key={item.room_type}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h3 className="font-semibold text-gray-800">
              {item.room_type}
            </h3>

            <p className="mt-2 text-2xl font-bold text-violet-600">
              {item.available_count}
            </p>

            <p className="text-sm text-gray-500">
              Available rooms
            </p>

            <p className="mt-2 text-sm text-gray-600">
              ₱{Number(item.price_per_night).toLocaleString()} / night
            </p>
          </div>
        ))}
      </div>

      {/* Room List */}
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onBook={onBook}
            />
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-gray-500">
          No rooms available for your selected dates.
        </p>
      )}
    </div>
  );
}
