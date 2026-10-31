<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use DateTimeImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    /**
     * Ensure the authenticated account is a customer, not an admin.
     */
    private function ensureCustomer(Request $request): ?JsonResponse
    {
        $user = $request->user();

        if (!$user || $user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Customer access only. Please log in with a customer account.',
            ], 403);
        }

        return null;
    }

    /**
     * Create a booking for the authenticated customer.
     */
    public function store(Request $request): JsonResponse
    {
        if ($response = $this->ensureCustomer($request)) {
            return $response;
        }

        $customer = $request->user();

        $validated = $request->validate([
            'room_id' => ['required', 'integer', 'exists:rooms,id'],
            'check_in' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
            ],
            'check_in_time' => ['required', 'date_format:H:i'],
            'check_out' => [
                'required',
                'date_format:Y-m-d',
                'after:check_in',
            ],
            'check_out_time' => ['required', 'date_format:H:i'],
            'guests' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $requestedCheckIn = new DateTimeImmutable(
            $validated['check_in'] . ' ' . $validated['check_in_time']
        );

        $requestedCheckOut = new DateTimeImmutable(
            $validated['check_out'] . ' ' . $validated['check_out_time']
        );

        if ($requestedCheckOut <= $requestedCheckIn) {
            throw ValidationException::withMessages([
                'check_out_time' => [
                    'Check-out must be later than check-in.',
                ],
            ]);
        }

        $checkInDate = new DateTimeImmutable($validated['check_in']);
        $checkOutDate = new DateTimeImmutable($validated['check_out']);

        $nights = (int) $checkInDate->diff($checkOutDate)->days;

        if ($nights < 1) {
            throw ValidationException::withMessages([
                'check_out' => ['The stay must be at least one night.'],
            ]);
        }

        $booking = DB::transaction(function () use (
            $validated,
            $customer,
            $requestedCheckIn,
            $requestedCheckOut,
            $nights
        ) {
            $requestedRoom = Room::query()
                ->whereKey($validated['room_id'])
                ->lockForUpdate()
                ->firstOrFail();

            if (!$requestedRoom->is_available) {
                throw ValidationException::withMessages([
                    'room_id' => ['This room is currently unavailable.'],
                ]);
            }

            if ($requestedRoom->capacity < (int) $validated['guests']) {
                throw ValidationException::withMessages([
                    'guests' => [
                        'This room cannot accommodate the requested number of guests.',
                    ],
                ]);
            }

            $hasConflict = Booking::query()
                ->where('room_id', $requestedRoom->id)
                ->where(function ($query) {
                    $query->whereNull('status')
                        ->orWhere('status', '!=', 'cancelled');
                })
                ->whereRaw(
                    "TIMESTAMP(
                        check_in,
                        COALESCE(check_in_time, '00:00:00')
                    ) < ?",
                    [$requestedCheckOut->format('Y-m-d H:i:s')]
                )
                ->whereRaw(
                    "TIMESTAMP(
                        check_out,
                        COALESCE(check_out_time, '23:59:59')
                    ) > ?",
                    [$requestedCheckIn->format('Y-m-d H:i:s')]
                )
                ->exists();

            if ($hasConflict) {
                throw ValidationException::withMessages([
                    'room_id' => [
                        'Sorry, this room has just been booked for your selected dates and times. Please choose another room.',
                    ],
                ]);
            }

            $totalPrice = round(
                $nights * (float) $requestedRoom->price_per_night,
                2
            );

            return Booking::create([
                'user_id' => $customer->id,
                'room_id' => $requestedRoom->id,
                'room_number' => $requestedRoom->room_number,
                'guest_name' => $customer->name,
                'guest_email' => $customer->email,
                'check_in' => $validated['check_in'],
                'check_in_time' => $validated['check_in_time'],
                'check_out' => $validated['check_out'],
                'check_out_time' => $validated['check_out_time'],
                'guests' => (int) $validated['guests'],
                'total_price' => $totalPrice,
                'status' => 'confirmed',
            ]);
        }, 3);

        $booking->load('room');

        return response()->json([
            'success' => true,
            'message' => 'Your booking has been confirmed!',
            'data' => $booking,
        ], 201);
    }

    /**
     * Show only a booking owned by the authenticated customer.
     */
    public function show(Request $request, $id): JsonResponse
    {
        if ($response = $this->ensureCustomer($request)) {
            return $response;
        }

        $booking = Booking::with('room')
            ->where('user_id', $request->user()->id)
            ->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    /**
     * Cancel only a booking owned by the authenticated customer.
     */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        if ($response = $this->ensureCustomer($request)) {
            return $response;
        }

        if ((int) $booking->user_id !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found.',
            ], 404);
        }

        if ($booking->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'This booking has already been cancelled.',
            ], 422);
        }

        $booking->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Booking cancelled successfully.',
            'data' => $booking->fresh('room'),
        ]);
    }
}