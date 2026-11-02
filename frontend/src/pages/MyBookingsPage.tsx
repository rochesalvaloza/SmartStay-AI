import { useState, type FormEvent } from "react";

import { API_URL } from "../services/api";

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  room_number: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number | string;
  status: string;
}

interface ApiResponse {
  success?: boolean;
  message?: string;
  data?: Booking;
}

export default function MyBookingsPage() {
  const [email, setEmail] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function findBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setBooking(null);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/bookings/${bookingId.trim()}?guest_email=${encodeURIComponent(email.trim())}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Booking not found.");
      }

      setBooking(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to find booking."
      );
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking() {
    if (!booking) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel booking #${booking.id}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/bookings/${booking.id}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            guest_email: email.trim(),
          }),
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Unable to cancel booking.");
      }

      setBooking(result.data);
      setMessage("Your booking has been cancelled successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel booking."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-4xl px-6 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-violet-700">My Bookings</h1>
        <p className="mt-2 text-slate-600">
          Find your booking using your booking reference and email address.
        </p>
      </div>

      <form
        onSubmit={findBooking}
        className="mx-auto max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label htmlFor="bookingId" className="mb-1 block font-medium">
            Booking Reference
          </label>
          <input
            id="bookingId"
            type="number"
            min="1"
            required
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-3 focus:border-violet-600 focus:outline-none"
            placeholder="Enter your booking ID"
          />
        </div>

        <div>
          <label htmlFor="bookingEmail" className="mb-1 block font-medium">
            Email Address
          </label>
          <input
            id="bookingEmail"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-3 focus:border-violet-600 focus:outline-none"
            placeholder="Email used for booking"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-violet-700 px-5 py-3 font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {loading ? "Searching..." : "Find Booking"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mx-auto mt-5 max-w-xl rounded-lg bg-red-50 p-4 text-red-700"
        >
          {error}
        </p>
      )}

      {message && (
        <p className="mx-auto mt-5 max-w-xl rounded-lg bg-green-50 p-4 text-green-700">
          {message}
        </p>
      )}

      {booking && (
        <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Booking #{booking.id}</h2>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p><strong>Guest:</strong> {booking.guest_name}</p>
            <p><strong>Room:</strong> {booking.room_number ?? "Assigned room"}</p>
            <p><strong>Check-in:</strong> {booking.check_in}</p>
            <p><strong>Check-out:</strong> {booking.check_out}</p>
            <p><strong>Guests:</strong> {booking.guests}</p>
            <p>
              <strong>Total:</strong>{" "}
              ₱{Number(booking.total_price).toLocaleString("en-PH")}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="font-semibold capitalize">
                {booking.status}
              </span>
            </p>
          </div>

          {booking.status.toLowerCase() !== "cancelled" && (
            <button
              type="button"
              onClick={cancelBooking}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading ? "Processing..." : "Cancel Booking"}
            </button>
          )}
        </section>
      )}
    </main>
  );
}
