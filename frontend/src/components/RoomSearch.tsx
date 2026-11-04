import type { FormEvent } from "react";

interface RoomSearchProps {
  checkIn: string;
  checkOut: string;
  searchGuests: string;
  setCheckIn: (value: string) => void;
  setCheckOut: (value: string) => void;
  setSearchGuests: (value: string) => void;
  searchMessage: string;
  getToday: () => string;
  onSearch: () => void;
}

export default function RoomSearch({
  checkIn,
  checkOut,
  searchGuests,
  setCheckIn,
  setCheckOut,
  setSearchGuests,
  searchMessage,
  getToday,
  onSearch,
}: RoomSearchProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-4">
        <div>
          <label
            htmlFor="checkin"
            className="mb-2 block text-sm font-semibold"
          >
            Check-in
          </label>

          <input
            id="checkin"
            type="date"
            min={getToday()}
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-violet-600"
          />
        </div>

        <div>
          <label
            htmlFor="checkout"
            className="mb-2 block text-sm font-semibold"
          >
            Check-out
          </label>

          <input
            id="checkout"
            type="date"
            min={checkIn || getToday()}
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-violet-600"
          />
        </div>

        <div>
          <label
            htmlFor="guests"
            className="mb-2 block text-sm font-semibold"
          >
            Guests
          </label>

          <select
            id="guests"
            value={searchGuests}
            onChange={(event) => setSearchGuests(event.target.value)}
            className="box-border w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-3 text-base outline-none focus:border-violet-600"
          >
            {[1, 2, 3, 4].map((guest) => (
              <option key={guest} value={guest}>
                {guest} {guest === 1 ? "Guest" : "Guests"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="min-h-12 w-full rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white transition hover:bg-violet-800"
          >
            Search Rooms
          </button>
        </div>
      </div>

      {searchMessage && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-violet-50 p-3 text-sm text-violet-800"
        >
          {searchMessage}
        </p>
      )}
    </form>
  );
}