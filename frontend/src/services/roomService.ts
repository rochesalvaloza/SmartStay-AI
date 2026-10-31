import { API_URL } from "./api";
import type { Room } from "../types/room";

interface GetRoomsOptions {
  checkIn?: string;
  checkOut?: string;
  guests?: number | string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface RoomTypeAvailability {
  room_type: string;
  available_count: number;
  price_per_night: number;
  capacity: number;
}

interface RoomsApiResponse {
  success?: boolean;
  message?: string;
  data?: Room[];
  availability?: RoomTypeAvailability[];
}

export interface RoomsResult {
  rooms: Room[];
  availability: RoomTypeAvailability[];
}

export async function getRooms(
  options: GetRoomsOptions = {},
): Promise<RoomsResult> {
  const params = new URLSearchParams();

  if (options.checkIn) {
    params.set("check_in", options.checkIn);
  }

  if (options.checkOut) {
    params.set("check_out", options.checkOut);
  }

  if (options.guests !== undefined && options.guests !== "") {
    params.set("guests", String(options.guests));
  }

  if (options.checkInTime) {
    params.set("check_in_time", options.checkInTime);
  }

  if (options.checkOutTime) {
    params.set("check_out_time", options.checkOutTime);
  }

  const query = params.toString();
  const url = query
    ? `${API_URL}/rooms?${query}`
    : `${API_URL}/rooms`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  const result: unknown = await response.json();

  if (!response.ok) {
    if (
      typeof result === "object" &&
      result !== null &&
      "errors" in result &&
      typeof result.errors === "object" &&
      result.errors !== null
    ) {
      const errors = Object.values(
        result.errors as Record<string, string[]>,
      )
        .flat()
        .join(" ");

      throw new Error(
        errors || `Failed to load rooms. Status: ${response.status}`,
      );
    }

    throw new Error(
      typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
        ? result.message
        : `Failed to load rooms. Status: ${response.status}`,
    );
  }

  if (Array.isArray(result)) {
    return {
      rooms: result as Room[],
      availability: [],
    };
  }

  if (
    typeof result === "object" &&
    result !== null &&
    "data" in result &&
    Array.isArray((result as RoomsApiResponse).data)
  ) {
    const apiResult = result as RoomsApiResponse;

    return {
      rooms: apiResult.data ?? [],
      availability: apiResult.availability ?? [],
    };
  }

  throw new Error(
    "The rooms API returned an unexpected response. Check the Laravel /api/rooms endpoint.",
  );
}