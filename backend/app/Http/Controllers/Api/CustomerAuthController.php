<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class CustomerAuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
        ]);

        // New accounts use the database default: is_admin = 0.
        $token = $user->createToken('smartstay-customer')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Customer account created successfully.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower(trim($validated['email'])))
            ->first();

        if (
            !$user ||
            $user->is_admin ||
            !Hash::check($validated['password'], $user->password)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid customer email or password.',
            ], 401);
        }

        $token = $user->createToken('smartstay-customer')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Customer login successful.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Customer access only.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Customer access only.',
            ], 403);
        }

        $user->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer logged out successfully.',
        ]);
    }
}