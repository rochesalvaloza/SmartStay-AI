import type { Room } from "../../types/room";
import RoomCard from "./RoomCard";

interface RoomListProps {
  rooms: Room[];
  onBook: (room: Room) => void;
}

export default function RoomList({
  rooms,
  onBook,
}: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <p className="py-10 text-center text-slate-500">
        No rooms available.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onBook={onBook}
        />
      ))}
    </div>
  );
}