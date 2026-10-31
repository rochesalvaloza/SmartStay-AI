<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RoomController extends Controller
{
    /**
     * Retrieve rooms and check availability for the requested stay.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'check_in' => [
                'nullable',
                'required_with:check_out',
                'date_format:Y-m-d',
            ],
            'check_out' => [
                'nullable',
                'required_with:check_in',
                'date_format:Y-m-d',
                'after:check_in',
            ],
            'check_in_time' => [
                'nullable',
                'required_with:check_out_time',
                'date_format:H:i',
            ],
            'check_out_time' => [
                'nullable',
                'required_with:check_in_time',
                'date_format:H:i',
            ],
            'guests' => [
                'sometimes',
                'integer',
                'min:1',
                'max:20',
            ],
        ]);

        $checkIn = $validated['check_in'] ?? null;
        $checkOut = $validated['check_out'] ?? null;
        $checkInTime = $validated['check_in_time'] ?? null;
        $checkOutTime = $validated['check_out_time'] ?? null;
        $guests = isset($validated['guests'])
            ? (int) $validated['guests']
            : null;

        $hasTimes = $checkInTime !== null && $checkOutTime !== null;

        if ($hasTimes && $checkIn !== null && $checkOut !== null) {
            $requestedStart = strtotime("$checkIn $checkInTime");
            $requestedEnd = strtotime("$checkOut $checkOutTime");

            if ($requestedEnd <= $requestedStart) {
                throw ValidationException::withMessages([
                    'check_out_time' => [
                        'Check-out must be later than check-in.',
                    ],
                ]);
            }
        }

        /*
         * Get rooms that are enabled and can accommodate
         * the requested number of guests.
         */
        $roomsQuery = Room::query()
            ->where('is_available', true);

        if ($guests !== null) {
            $roomsQuery->where('capacity', '>=', $guests);
        }

        /*
         * Exclude rooms with overlapping bookings.
         * Cancelled bookings do not block availability.
         */
        if ($checkIn !== null && $checkOut !== null) {
            $roomsQuery->whereDoesntHave(
                'bookings',
                function (Builder $query) use (
                    $checkIn,
                    $checkOut,
                    $checkInTime,
                    $checkOutTime,
                    $hasTimes
                ) {
                    $query->where(function (Builder $statusQuery) {
                        $statusQuery
                            ->whereNull('status')
                            ->orWhere('status', '!=', 'cancelled');
                    });

                    if ($hasTimes) {
                        /*
                         * Treat missing booking times conservatively:
                         * missing check-in time = start of day;
                         * missing check-out time = end of day.
                         */
                        $query
                            ->whereRaw(
                                "TIMESTAMP(
                                    check_in,
                                    COALESCE(check_in_time, '00:00:00')
                                ) < ?",
                                ["$checkOut $checkOutTime"]
                            )
                            ->whereRaw(
                                "TIMESTAMP(
                                    check_out,
                                    COALESCE(check_out_time, '23:59:59')
                                ) > ?",
                                ["$checkIn $checkInTime"]
                            );
                    } else {
                        /*
                         * Standard overnight booking overlap:
                         * existing check-in < requested check-out,
                         * and existing check-out > requested check-in.
                         */
                        $query
                            ->where('check_in', '<', $checkOut)
                            ->where('check_out', '>', $checkIn);
                    }
                }
            );
        }

        $rooms = $roomsQuery
            ->orderBy('room_type')
            ->orderBy('room_number')
            ->orderBy('id')
            ->get();

        /*
         * Group the available physical rooms by room type.
         */
        $availability = $rooms
            ->groupBy('room_type')
            ->map(function ($typeRooms) {
                $firstRoom = $typeRooms->first();

                return [
                    'room_type' => $firstRoom->room_type,
                    'available_count' => $typeRooms->count(),
                    'price_per_night' => $firstRoom->price_per_night,
                    'capacity' => $firstRoom->capacity,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'message' => 'Rooms retrieved successfully.',
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'check_in_time' => $checkInTime,
            'check_out_time' => $checkOutTime,
            'guests' => $guests,
            'availability' => $availability,
            'data' => $rooms,
        ]);
    }

    /**
     * Retrieve one enabled room.
     */
    public function show(Room $room): JsonResponse
    {
        if (!$room->is_available) {
            return response()->json([
                'success' => false,
                'message' => 'This room is currently unavailable.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $room,
        ]);
    }
}