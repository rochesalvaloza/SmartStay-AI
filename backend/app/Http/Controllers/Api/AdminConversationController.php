<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ChatMessage;
use Illuminate\Http\Request;

class AdminConversationController extends Controller
{
    // Get all customer conversations
    public function index()
    {
        $conversations = Conversation::with([
            'messages' => function ($query) {
                $query->latest()->limit(1);
            }
        ])
        ->withCount([
            'messages as unread_count' => function ($query) {
                $query->where('sender_type', 'customer')
                      ->whereNull('read_at');
            }
        ])
        ->orderByDesc('last_message_at')
        ->get();

        return response()->json([
            'success' => true,
            'conversations' => $conversations,
        ]);
    }

    // View a conversation and mark customer messages as read
    public function show(Conversation $conversation)
{
    $conversation->messages()
        ->where('sender_type', 'customer')
        ->whereNull('read_at')
        ->update(['read_at' => now()]);

    return response()->json([
        'success' => true,
        'conversation' => $conversation->load([
            'messages' => function ($query) {
                $query->orderBy('id', 'asc');
            }
        ]),
    ]);
}

    // Send an admin reply
    public function reply(Request $request, Conversation $conversation)
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $message = $conversation->messages()->create([
            'sender_type' => 'admin',
            'message' => $validated['message'],
        ]);

        $conversation->update([
            'last_message_at' => now(),
            'status' => 'open',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Reply sent successfully.',
            'reply' => $message,
        ], 201);
    }

    // Update conversation status
    public function updateStatus(Request $request, Conversation $conversation)
    {
        $validated = $request->validate([
            'status' => ['required', 'in:open,closed'],
        ]);

        $conversation->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Conversation status updated.',
            'conversation' => $conversation,
        ]);
    }
}
