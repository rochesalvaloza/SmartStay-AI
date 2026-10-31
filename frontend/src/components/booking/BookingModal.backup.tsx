import { useState, type FormEvent } from "react";
import type { Room } from "../../types/room";

const API_URL = "http://127.0.0.1:8000/api";

interface BookingResponse {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    total_price?: number | string;
    status?: string;
  };
  booking?: {
    id?: number;
    total_price?: number | string;
    status?: string;
  };
  errors?: Record<string, string[]>;
}

interface BookingModalProps {
  room: Room;
  initialCheckIn: string;
  initialCheckOut: string;
  initialGuests: string;
  onClose: () => void;
  onSuccess: () => void;
}

function getToday(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function BookingModal({
  room,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(
    Number(initialGuests) >= 1 && Number(initialGuests) <= room.capacity
      ? initialGuests
      : "2",
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guestName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!guestEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!checkIn || !checkOut) {
      setError("Please select your check-in and check-out dates.");
      return;
    }

    if (checkIn < getToday()) {
      setError("Check-in cannot be in the past.");
      return;
    }

    if (checkOut <= checkIn) {
      setError("Check-out must be later than check-in.");
      return;
    }

    if (Number(guests) < 1 || Number(guests) > room.capacity) {
      setError(`This room can accommodate up to ${room.capacity} guests.`);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          room_id: room.id,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          check_in: checkIn,
          check_out: checkOut,
          guests: Number(guests),
        }),
      });

      const result: BookingResponse = await response.json();

      if (!response.ok) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat().join(" ")
          : "";

        throw new Error(
          validationMessage ||
            result.message ||
            "Booking failed. Please check your details and try again.",
        );
      }

      const booking = result.data ?? result.booking;

      setMessage(
        [
          result.message || "Your booking was submitted successfully!",
          booking?.id ? `Booking reference: #${booking.id}` : "",
          booking?.total_price !== undefined
            ? `Total price: ₱${Number(booking.total_price).toLocaleString("en-PH")}`
            : "",
          booking?.status ? `Status: ${booking.status}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your booking.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl md:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="booking-title" className="text-2xl font-bold">
              Book Your Stay
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {room.name} · ₱
              {Number(room.price_per_night).toLocaleString("en-PH")}
              {" / night"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close booking form"
            className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {message ? (
          <div className="rounded-xl bg-green-50 p-5 text-green-800">
            <h3 className="font-bold">Booking submitted</h3>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
              {message}
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submitBooking} className="space-y-4">
            <div>
              <label
                htmlFor="guestName"
                className="mb-1 block text-sm font-semibold"
              >
                Full Name
              </label>

              <input
                id="guestName"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                required
                maxLength={255}
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-violet-600"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label
                htmlFor="guestEmail"
                className="mb-1 block text-sm font-semibold"
              >
                Email Address
              </label>

              <input
                id="guestEmail"
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                required
                maxLength={255}
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-violet-600"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="bookingCheckIn"
                className="mb-1 block text-sm font-semibold"
              >
                Check-in
              </label>

              <input
                id="bookingCheckIn"
                type="date"
                min={getToday()}
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-violet-600"
              />
            </div>

            <div>
              <label
                htmlFor="bookingCheckOut"
                className="mb-1 block text-sm font-semibold"
              >
                Check-out
              </label>

              <input
                id="bookingCheckOut"
                type="date"
                min={checkIn || getToday()}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-violet-600"
              />
            </div>

            <div>
              <label
                htmlFor="bookingGuests"
                className="mb-1 block text-sm font-semibold"
              >
                Number of Guests
              </label>

              <select
                id="bookingGuests"
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-violet-600"
              >
                {Array.from(
                  { length: room.capacity },
                  (_, index) => index + 1,
                ).map((guest) => (
                  <option key={guest} value={guest}>
                    {guest} {guest === 1 ? "Guest" : "Guests"}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Submitting Booking..." : "Confirm Booking"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Your booking will be checked by the server before it is saved.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}