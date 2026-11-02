<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AdminDashboardController extends Controller
{
    /**
     * Automatically complete confirmed bookings
     * when their checkout date and time have passed.
     */
    private function updateCompletedBookings(): void
    {
        $now = Carbon::now();

        Booking::query()
            ->where('status', 'confirmed')
            ->whereDate('check_out', '<=', $now->toDateString())
            ->get()
            ->each(function (Booking $booking) use ($now) {
                $checkoutDate = $booking->check_out instanceof Carbon
                    ? $booking->check_out->toDateString()
                    : Carbon::parse($booking->check_out)->toDateString();

                // If no checkout time is saved, use the end of checkout day.
                $checkoutTime = $booking->check_out_time ?: '23:59:59';

                $checkoutAt = Carbon::parse(
                    $checkoutDate . ' ' . $checkoutTime
                );

                if ($checkoutAt->lessThanOrEqualTo($now)) {
                    $booking->update([
                        'status' => 'completed',
                    ]);
                }
            });
    }

    /**
     * Return dashboard statistics.
     */
    public function index(): JsonResponse
    {
        $this->updateCompletedBookings();

        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        $confirmedBookings = Booking::where('status', 'confirmed');

        // Count enabled rooms that have no active reservation today.
        $availableRooms = Room::query()
            ->where('is_available', true)
            ->whereDoesntHave('bookings', function ($query) use (
                $today,
                $tomorrow
            ) {
                $query
                    ->where(function ($statusQuery) {
                        $statusQuery
                            ->whereNull('status')
                            ->orWhereNotIn('status', [
                                'cancelled',
                                'completed',
                            ]);
                    })
                    ->where('check_in', '<', $tomorrow)
                    ->where('check_out', '>', $today);
            })
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_rooms' => Room::count(),

                'available_rooms' => $availableRooms,

                'total_bookings' => Booking::count(),

                'confirmed_bookings' => Booking::where(
                    'status',
                    'confirmed'
                )->count(),

                'pending_bookings' => Booking::where(
                    'status',
                    'pending'
                )->count(),

                'cancelled_bookings' => Booking::where(
                    'status',
                    'cancelled'
                )->count(),

                'completed_bookings' => Booking::where(
                    'status',
                    'completed'
                )->count(),

                'estimated_revenue' => (float) $confirmedBookings
                    ->sum('total_price'),
            ],
        ]);
    }

    /**
     * Return reservations with optional search and status filtering.
     */
    public function bookings(Request $request): JsonResponse
    {
        $this->updateCompletedBookings();

        $validated = $request->validate([
            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'confirmed',
                    'cancelled',
                    'completed',
                ]),
            ],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $query = Booking::with('room')->latest();

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($bookingQuery) use ($search) {
                $bookingQuery
                    ->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%")
                    ->orWhereHas('room', function ($roomQuery) use ($search) {
                        $roomQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $bookings = $query->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }
}