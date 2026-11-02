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
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'check_in' => ['nullable', 'required_with:check_out', 'date_format:Y-m-d'],
            'check_out' => ['nullable', 'required_with:check_in', 'date_format:Y-m-d', 'after:check_in'],
            'check_in_time' => ['nullable', 'required_with:check_out_time', 'date_format:H:i'],
            'check_out_time' => ['nullable', 'required_with:check_in_time', 'date_format:H:i'],
            'guests' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ]);

        $checkIn = $validated['check_in'] ?? null;
        $checkOut = $validated['check_out'] ?? null;
        $checkInTime = $validated['check_in_time'] ?? null;
        $checkOutTime = $validated['check_out_time'] ?? null;
        $guests = isset($validated['guests']) ? (int) $validated['guests'] : null;

        $hasTimes = $checkInTime !== null && $checkOutTime !== null;

        if ($hasTimes && $checkIn && $checkOut) {
            $requestedStart = strtotime("$checkIn $checkInTime");
            $requestedEnd = strtotime("$checkOut $checkOutTime");

            if ($requestedEnd <= $requestedStart) {
                throw ValidationException::withMessages([
                    'check_out_time' => ['Check-out must be later than check-in.'],
                ]);
            }
        }

        $now = now();

        $roomsQuery = Room::query()
            ->where('is_available', true);

        if ($guests !== null) {
            $roomsQuery->where('capacity', '>=', $guests);
        }

        /*
         * Exclude bookings that overlap the requested stay.
         * Cancelled bookings and bookings whose checkout has passed
         * do not block room availability.
         */
        $roomsQuery->whereDoesntHave('bookings', function (Builder $query) use (
            $checkIn,
            $checkOut,
            $checkInTime,
            $checkOutTime,
            $hasTimes,
            $now
        ) {
            $query->where(function (Builder $statusQuery) {
                $statusQuery
                    ->whereNull('status')
                    ->orWhereNotIn('status', ['cancelled', 'completed']);
            });

            // Ignore reservations that have already ended.
            $query->whereRaw(
                "TIMESTAMP(check_out, COALESCE(check_out_time, '23:59:59')) > ?",
                [$now->format('Y-m-d H:i:s')]
            );

            if ($checkIn && $checkOut) {
                if ($hasTimes) {
                    $query
                        ->whereRaw(
                            "TIMESTAMP(check_in, COALESCE(check_in_time, '00:00:00')) < ?",
                            ["$checkOut $checkOutTime"]
                        )
                        ->whereRaw(
                            "TIMESTAMP(check_out, COALESCE(check_out_time, '23:59:59')) > ?",
                            ["$checkIn $checkInTime"]
                        );
                } else {
                    $query
                        ->where('check_in', '<', $checkOut)
                        ->where('check_out', '>', $checkIn);
                }
            } else {
                // Without requested dates, only show rooms with no
                // currently active or future reservation.
                $query->whereRaw(
                    "TIMESTAMP(check_in, COALESCE(check_in_time, '00:00:00')) <= ?",
                    [$now->format('Y-m-d H:i:s')]
                );
            }
        });

        $rooms = $roomsQuery
            ->orderBy('room_type')
            ->orderBy('room_number')
            ->orderBy('id')
            ->get();

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