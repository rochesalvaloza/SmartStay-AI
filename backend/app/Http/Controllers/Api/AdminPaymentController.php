<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminPaymentController extends Controller
{
    /**
     * List bookings with payment information.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Booking::with('room')
            ->whereNotNull('payment_method')
            ->orderByDesc('updated_at');

        if ($request->filled('status')) {
            $query->where('payment_status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();

            $query->where(function ($builder) use ($search) {
                $builder->where('guest_name', 'like', "%{$search}%")
                    ->orWhere('guest_email', 'like', "%{$search}%")
                    ->orWhere('payment_reference', 'like', "%{$search}%")
                    ->orWhere('id', $search);
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->paginate(10),
        ]);
    }

    /**
     * View a private payment receipt.
     */
    public function receipt(Booking $booking)
    {
        $path = $booking->payment_proof_path;

        abort_unless(
            $path &&
            str_starts_with($path, 'payment-proofs/') &&
            Storage::disk('local')->exists($path),
            404,
            'Payment receipt not found.'
        );

        $absolutePath = Storage::disk('local')->path($path);

        return response()->file($absolutePath, [
            'Content-Disposition' => 'inline; filename="payment-receipt-' . $booking->id . '"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Approve a manually submitted GCash or Maya payment.
     */
    public function approve(Booking $booking): JsonResponse
    {
        if (!in_array($booking->payment_method, ['gcash', 'maya'], true)) {
            throw ValidationException::withMessages([
                'payment_method' => [
                    'Only GCash and Maya payments can be approved here.',
                ],
            ]);
        }

        if ($booking->payment_status !== 'pending') {
            throw ValidationException::withMessages([
                'payment_status' => [
                    'Only pending payments can be approved.',
                ],
            ]);
        }

        if (!$booking->payment_reference || !$booking->payment_proof_path) {
            throw ValidationException::withMessages([
                'payment_proof' => [
                    'The payment reference and receipt must be submitted first.',
                ],
            ]);
        }

        $booking->update([
            'payment_status' => 'paid',
            'payment_verified_at' => now(),
            'payment_rejection_reason' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment approved successfully.',
            'data' => $booking->fresh('room'),
        ]);
    }

    /**
     * Reject a submitted GCash or Maya payment.
     */
    public function reject(Request $request, Booking $booking): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        if (!in_array($booking->payment_method, ['gcash', 'maya'], true)) {
            throw ValidationException::withMessages([
                'payment_method' => [
                    'Only GCash and Maya payments can be rejected here.',
                ],
            ]);
        }

        if ($booking->payment_status !== 'pending') {
            throw ValidationException::withMessages([
                'payment_status' => [
                    'Only pending payments can be rejected.',
                ],
            ]);
        }

        $booking->update([
            'payment_status' => 'rejected',
            'payment_verified_at' => null,
            'payment_rejection_reason' => $validated['reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment rejected.',
            'data' => $booking->fresh('room'),
        ]);
    }

    /**
     * Mark cash as paid after the hotel receives it.
     */
    public function collectCash(Booking $booking): JsonResponse
    {
        if ($booking->payment_method !== 'cash_at_hotel') {
            throw ValidationException::withMessages([
                'payment_method' => [
                    'This booking is not a Cash at Hotel booking.',
                ],
            ]);
        }

        if ($booking->payment_status === 'paid') {
            throw ValidationException::withMessages([
                'payment_status' => ['This payment is already marked as paid.'],
            ]);
        }

        if ($booking->payment_status === 'unrecorded') {
            throw ValidationException::withMessages([
                'payment_status' => [
                    'This booking has no recorded payment selection.',
                ],
            ]);
        }

        $booking->update([
            'payment_status' => 'paid',
            'payment_verified_at' => now(),
            'payment_rejection_reason' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cash collection recorded successfully.',
            'data' => $booking->fresh('room'),
        ]);
    }
}