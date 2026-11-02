<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerConversationController extends Controller
{
    // Get the customer's latest conversation and its messages.
    public function show(Request $request): JsonResponse
    {
        $customer = $request->user();

        if (!$customer || $customer->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Customer access only.',
            ], 403);
        }

        $conversation = Conversation::where('user_id', $customer->id)
            ->latest('last_message_at')
            ->latest('id')
            ->with([
                'messages' => function ($query) {
                    $query->orderBy('id', 'asc');
                }
            ])
            ->first();

        return response()->json([
            'success' => true,
            'conversation' => $conversation,
        ]);
    }
}