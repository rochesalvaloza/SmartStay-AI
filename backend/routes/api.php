<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminConversationController;
use App\Http\Controllers\Api\AdminPaymentController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\CustomerAuthController;
use App\Http\Controllers\Api\CustomerConversationController;

// Customer chatbot
Route::middleware('auth:sanctum')->post(
    '/chat',
    [ChatbotController::class, 'chat']
);

// Public room browsing
Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/{room}', [RoomController::class, 'show']);

// Customer authentication
Route::post('/register', [CustomerAuthController::class, 'register'])
    ->middleware('throttle:5,1');

Route::post('/login', [CustomerAuthController::class, 'login'])
    ->middleware('throttle:5,1');

// Administrator login
Route::post('/admin/login', [AdminAuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::get('/sanctum-test', function (\Illuminate\Http\Request $request) {
    return response()->json([
        'authenticated' => auth('sanctum')->check(),
        'user' => $request->user('sanctum'),
        'authorization_header_present' => $request->headers->has('Authorization'),
    ]);
})->middleware('auth:sanctum');

// Customer-only routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/customer/me', [CustomerAuthController::class, 'me']);
    Route::post('/customer/logout', [CustomerAuthController::class, 'logout']);

    // Customer chat history
    Route::get('/customer/conversation', [CustomerConversationController::class, 'show']);

    // Bookings
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
});

// Protected administrator routes
Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin')
    ->group(function () {

        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/me', [AdminAuthController::class, 'me']);

        // Dashboard and reservations
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);
        Route::get('/bookings', [AdminDashboardController::class, 'bookings']);

        // Customer messages
        Route::get('/conversations', [AdminConversationController::class, 'index']);
        Route::get('/conversations/{conversation}', [AdminConversationController::class, 'show']);
        Route::post('/conversations/{conversation}/reply', [AdminConversationController::class, 'reply']);
        Route::post('/conversations/{conversation}/status', [AdminConversationController::class, 'updateStatus']);

        // Payment verification
        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::get('/payments/{booking}/receipt', [AdminPaymentController::class, 'receipt']);
        Route::post('/payments/{booking}/approve', [AdminPaymentController::class, 'approve']);
        Route::post('/payments/{booking}/reject', [AdminPaymentController::class, 'reject']);
        Route::post('/payments/{booking}/collect-cash', [AdminPaymentController::class, 'collectCash']);
    });