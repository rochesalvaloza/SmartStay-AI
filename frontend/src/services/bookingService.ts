import { API_URL } from "./api";

export interface CancelBookingResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    status: string;
    room_number?: string;
  };
}

/**
 * Cancel a booking without deleting its database record.
 */
export async function cancelBooking(
  bookingId: number,
  guestEmail: string
): Promise<CancelBookingResponse> {
  const response = await fetch(
    `${API_URL}/bookings/${bookingId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        guest_email: guestEmail,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "Unable to cancel the booking."
    );
  }

  return result;
}
