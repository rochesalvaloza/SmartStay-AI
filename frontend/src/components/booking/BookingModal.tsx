import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Room } from "../../types/room";
import { API_URL } from "../../services/api";
import {
  getCustomerToken,
  getStoredCustomer,
} from "../../services/authService";

interface BookingResponse {
  success?: boolean;
  message?: string;
  data?: {
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

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

const labelClass =
  "mb-2 block text-sm font-semibold text-slate-700";

export default function BookingModal({
  room,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const navigate = useNavigate();

  const customer = getStoredCustomer();
  const token = getCustomerToken();

  const [guestName] = useState(customer?.name ?? "");
  const [guestEmail] = useState(customer?.email ?? "");

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);

  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");

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

    // Require customer authentication.
    if (!customer || !token) {
      onClose();
      navigate("/login");
      return;
    }

    if (!checkIn || !checkOut || !checkInTime || !checkOutTime) {
      setError("Please select your check-in and check-out dates and times.");
      return;
    }

    if (checkIn < getToday()) {
      setError("Check-in cannot be in the past.");
      return;
    }

    if (checkOut <= checkIn) {
      setError("Check-out must be at least one day after check-in.");
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: room.id,
          check_in: checkIn,
          check_in_time: checkInTime,
          check_out: checkOut,
          check_out_time: checkOutTime,
          guests: Number(guests),
        }),
      });

      const result: BookingResponse = await response.json();

      if (!response.ok || !result.success || !result.data?.id) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat().join(" ")
          : "";

        if (response.status === 401) {
          throw new Error("Your session has expired. Please log in again.");
        }

        throw new Error(
          validationMessage ||
            result.message ||
            "Booking failed. Please check your details and try again.",
        );
      }

      const booking = result.data;

      setMessage(
        [
          result.message || "Your booking was submitted successfully!",
          `Booking reference: #${booking.id}`,
          `Check-in: ${checkIn} at ${checkInTime}`,
          `Check-out: ${checkOut} at ${checkOutTime}`,
          booking.total_price !== undefined
            ? `Total price: ₱${Number(booking.total_price).toLocaleString("en-PH")}`
            : "",
          booking.status ? `Status: ${booking.status}` : "",
          `Guest name: ${guestName}`,
          `Guest email: ${guestEmail}`,
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
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="my-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="bg-gradient-to-r from-violet-700 to-indigo-600 px-6 py-7 text-white md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
                SmartStay AI
              </p>

              <h2 id="booking-title" className="text-2xl font-bold md:text-3xl">
                Book Your Stay
              </h2>

              <p className="mt-2 text-sm text-violet-100">
                Complete your details to reserve your room.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Close booking form"
              className="rounded-xl px-3 py-1 text-3xl leading-none text-white transition hover:bg-white/15 disabled:opacity-50"
            >
              ×
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-lg font-bold">{room.name}</p>
            <p className="mt-1 text-sm text-violet-100">
              Room capacity: {room.capacity} guests
            </p>

            <p className="mt-3 text-2xl font-bold">
              ₱{Number(room.price_per_night).toLocaleString("en-PH")}
              <span className="ml-1 text-sm font-normal text-violet-100">
                / night
              </span>
            </p>
          </div>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-6 md:px-8">
          {message ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
              <h3 className="text-lg font-bold">Booking submitted!</h3>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                {message}
              </p>

              <p className="mt-3 text-sm">
                You can use your Booking Reference to find your reservation
                under My Bookings.
              </p>

              <button
                type="button"
                onClick={handleClose}
                className="mt-5 w-full rounded-xl bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={submitBooking} className="space-y-6">
              {/* Guest Information */}
              <div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Guest Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input
                      value={guestName}
                      readOnly
                      className={`${inputClass} bg-slate-100`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input
                      value={guestEmail}
                      readOnly
                      className={`${inputClass} bg-slate-100`}
                    />
                  </div>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Your booking will be registered under your logged-in account.
                </p>
              </div>

              {/* Reservation Details */}
              <div>
                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Reservation Details
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="bookingCheckIn" className={labelClass}>
                      Check-in Date
                    </label>

                    <input
                      id="bookingCheckIn"
                      type="date"
                      min={getToday()}
                      value={checkIn}
                      onChange={(event) => setCheckIn(event.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="bookingCheckInTime" className={labelClass}>
                      Check-in Time
                    </label>

                    <input
                      id="bookingCheckInTime"
                      type="time"
                      value={checkInTime}
                      onChange={(event) => setCheckInTime(event.target.value)}
                      required
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Suggested time: 2:00 PM
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bookingCheckOut" className={labelClass}>
                      Check-out Date
                    </label>

                    <input
                      id="bookingCheckOut"
                      type="date"
                      min={checkIn || getToday()}
                      value={checkOut}
                      onChange={(event) => setCheckOut(event.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="bookingCheckOutTime" className={labelClass}>
                      Check-out Time
                    </label>

                    <input
                      id="bookingCheckOutTime"
                      type="time"
                      value={checkOutTime}
                      onChange={(event) => setCheckOutTime(event.target.value)}
                      required
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Suggested time: 11:00 AM
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="bookingGuests" className={labelClass}>
                      Number of Guests
                    </label>

                    <select
                      id="bookingGuests"
                      value={guests}
                      onChange={(event) => setGuests(event.target.value)}
                      className={inputClass}
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
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-violet-700 px-5 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting Booking..." : "Confirm Booking"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                Your reservation will be validated by the server before it is
                saved. Check-in and check-out times are subject to the
                property's policies.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}