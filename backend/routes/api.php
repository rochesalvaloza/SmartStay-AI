<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminConversationController;
use App\Http\Controllers\Api\ChatbotController;
use App\Http\Controllers\Api\CustomerAuthController;

// Public chatbot route (we will protect this in a later step)
Route::middleware('auth:sanctum')->post(
    '/chat',
    [ChatbotController::class, 'chat']
);

// Public room browsing
Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/{room}', [RoomController::class, 'show']);

// Customer-only booking routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
});

// Administrator login
Route::post('/admin/login', [AdminAuthController::class, 'login'])
    ->middleware('throttle:5,1');

// Customer authentication
Route::post('/register', [CustomerAuthController::class, 'register'])
    ->middleware('throttle:5,1');

Route::post('/login', [CustomerAuthController::class, 'login'])
    ->middleware('throttle:5,1');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/customer/me', [CustomerAuthController::class, 'me']);
    Route::post('/customer/logout', [CustomerAuthController::class, 'logout']);
});

// Protected administrator routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::post('/logout', [AdminAuthController::class, 'logout']);
    Route::get('/me', [AdminAuthController::class, 'me']);

    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/bookings', [AdminDashboardController::class, 'bookings']);

    // Customer messages
    Route::get('/conversations', [AdminConversationController::class, 'index']);
    Route::get('/conversations/{conversation}', [AdminConversationController::class, 'show']);
    Route::post('/conversations/{conversation}/reply', [AdminConversationController::class, 'reply']);
    Route::post('/conversations/{conversation}/status', [AdminConversationController::class, 'updateStatus']);
});