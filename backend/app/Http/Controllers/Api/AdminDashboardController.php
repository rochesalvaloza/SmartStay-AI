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
     * Return dashboard statistics.
     */
    public function index(): JsonResponse
    {
        $today = Carbon::today()->toDateString();
        $tomorrow = Carbon::tomorrow()->toDateString();

        $confirmedBookings = Booking::where('status', 'confirmed');

        // Count enabled rooms that are not occupied today.
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
                            ->orWhereNotIn('status', ['cancelled']);
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
        $validated = $request->validate([
            'status' => [
                'nullable',
                Rule::in(['pending', 'confirmed', 'cancelled']),
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