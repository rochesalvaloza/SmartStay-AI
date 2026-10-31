import { useEffect, useState } from "react";
import RoomSearch from "../components/RoomSearch";
import RoomList from "../components/rooms/RoomList";
import BookingModal from "../components/booking/BookingModal";
import { getRooms } from "../services/roomService";
import type { Room, RoomTypeAvailability } from "../types/room";

function getToday(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTomorrow(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const day = String(tomorrow.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

export default function RoomsPage() {
    const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
    const [availability, setAvailability] = useState<RoomTypeAvailability[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    const [checkIn, setCheckIn] = useState(getToday());
    const [checkOut, setCheckOut] = useState(getTomorrow());
    const [searchGuests, setSearchGuests] = useState("2");

    const [searchMessage, setSearchMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadRooms() {
            setLoading(true);
            setError("");

            try {
                const result = await getRooms({
                    checkIn,
                    checkOut,
                    guests: Number(searchGuests),
                });

                if (!cancelled) {
                    setFilteredRooms(result.rooms);
                    setAvailability(result.availability);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load rooms. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadRooms();

        return () => {
            cancelled = true;
        };
    }, [refresh, checkIn, checkOut, searchGuests]);

    async function searchAvailableRooms() {
        setSearchMessage("");
        setError("");

        if (!checkIn || !checkOut) {
            setSearchMessage(
                "Please select both check-in and check-out dates."
            );
            return;
        }

        if (checkIn < getToday()) {
            setSearchMessage("Check-in date cannot be in the past.");
            return;
        }

        if (checkOut <= checkIn) {
            setSearchMessage(
                "Check-out date must be later than the check-in date."
            );
            return;
        }

        const guestCount = Number(searchGuests);

        if (!Number.isInteger(guestCount) || guestCount < 1) {
            setSearchMessage("Please select a valid number of guests.");
            return;
        }

        setLoading(true);

        try {
            const result = await getRooms({
                checkIn,
                checkOut,
                guests: guestCount,
            });

            setFilteredRooms(result.rooms);
            setAvailability(result.availability);

            if (result.rooms.length === 0) {
                setSearchMessage(
                    "No available rooms match your selected dates and number of guests. Please try different dates or fewer guests."
                );
            } else {
                setSearchMessage(
                    `Found ${result.rooms.length} available room(s) for your selected dates and ${guestCount} guest(s).`
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to search for available rooms. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleBookingSuccess() {
        setSelectedRoom(null);
        setRefresh((previous) => previous + 1);
        setSearchMessage(
            "Booking submitted successfully. Room information is being refreshed."
        );
    }

    return (
        <main className="min-h-screen">
            <section className="mx-auto max-w-7xl px-4 py-8">
                <RoomSearch
                    checkIn={checkIn}
                    checkOut={checkOut}
                    searchGuests={searchGuests}
                    setCheckIn={setCheckIn}
                    setCheckOut={setCheckOut}
                    setSearchGuests={setSearchGuests}
                    searchMessage={searchMessage}
                    getToday={getToday}
                    onSearch={searchAvailableRooms}
                />

                {loading && (
                    <p className="py-6 text-center text-gray-600">
                        Loading rooms...
                    </p>
                )}

                {!loading && error && (
                    <div
                        role="alert"
                        className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
                    >
                        {error}
                    </div>
                )}

                {!loading && !error && filteredRooms.length === 0 && (
                    <div className="py-10 text-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            No Rooms Found
                        </h2>

                        <p className="mt-2 text-gray-600">
                            Try different dates or adjust the number of guests.
                        </p>
                    </div>
                )}

                {!loading && !error && filteredRooms.length > 0 && (
                    <RoomList
                        rooms={filteredRooms}
                        onBook={(room) => setSelectedRoom(room)}
                        availability={availability}
                    />
                )}
            </section>

            {selectedRoom && (
                <BookingModal
                    room={selectedRoom}
                    initialCheckIn={checkIn}
                    initialCheckOut={checkOut}
                    initialGuests={searchGuests}
                    onClose={() => setSelectedRoom(null)}
                    onSuccess={handleBookingSuccess}
                />
            )}
        </main>
    );
}