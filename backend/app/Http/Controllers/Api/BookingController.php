<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Room;
use DateTimeImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

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
     * Create a booking with manual payment submission.
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

            'payment_method' => [
                'required',
                'in:gcash,maya,cash_at_hotel',
            ],

            'payment_reference' => [
                'nullable',
                'required_if:payment_method,gcash,maya',
                'string',
                'max:100',
            ],

            'payment_proof' => [
                'nullable',
                'required_if:payment_method,gcash,maya',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120',
            ],
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

        /*
         * Payment status is assigned by the server.
         * Customers cannot submit their own payment status.
         */
        $paymentMethod = $validated['payment_method'];

        $paymentStatus = $paymentMethod === 'cash_at_hotel'
            ? 'unpaid'
            : 'pending';

        $proofPath = null;

        /*
         * Store receipts privately.
         * Do not use the public storage disk for payment receipts.
         */
        if (
            in_array($paymentMethod, ['gcash', 'maya'], true)
            && $request->hasFile('payment_proof')
        ) {
            $proofPath = $request->file('payment_proof')
    ->store('payment-proofs', 'local');
        }

        try {
            $booking = DB::transaction(function () use (
                $validated,
                $customer,
                $requestedCheckIn,
                $requestedCheckOut,
                $nights,
                $paymentMethod,
                $paymentStatus,
                $proofPath
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

                    // Reservation status remains separate from payment status.
                    'status' => 'confirmed',

                    // Payment information
                    'payment_method' => $paymentMethod,
                    'payment_status' => $paymentStatus,
                    'payment_reference' => $paymentMethod === 'cash_at_hotel'
                        ? null
                        : $validated['payment_reference'],
                    'payment_proof_path' => $proofPath,
                    'payment_verified_at' => null,
                    'payment_rejection_reason' => null,
                ]);
            }, 3);
        } catch (Throwable $exception) {
            // Remove the uploaded receipt if booking creation fails.
            if ($proofPath) {
               Storage::disk('local')->delete($proofPath);
            }

            throw $exception;
        }

        $booking->load('room');

        return response()->json([
            'success' => true,
            'message' => $paymentStatus === 'pending'
                ? 'Your booking was submitted successfully. Your payment is waiting for admin verification.'
                : 'Your booking was submitted successfully. Please pay at the hotel.',
            'data' => $booking,
        ], 201);
    }

    /**
     * Show only a booking owned by the authenticated customer.
     */
    /**
 * Find a booking using its ID and the guest's email address.
 */
public function show(Request $request, $id): JsonResponse
{
    // Validate the guest email.
    $validated = $request->validate([
        'guest_email' => ['required', 'email', 'max:255'],
    ]);

    $email = strtolower(trim($validated['guest_email']));

    // Find the booking using both booking ID and email.
    $booking = Booking::query()
        ->select([
            'id',
            'guest_name',
            'guest_email',
            'room_number',
            'check_in',
            'check_out',
            'guests',
            'total_price',
            'status',
        ])
        ->where('id', $id)
        ->whereRaw('LOWER(guest_email) = ?', [$email])
        ->first();

    // Return an error if no matching booking exists.
    if (!$booking) {
        return response()->json([
            'success' => false,
            'message' => 'Booking not found. Please check your booking reference and email address.',
        ], 404);
    }

    // Return the matching booking.
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