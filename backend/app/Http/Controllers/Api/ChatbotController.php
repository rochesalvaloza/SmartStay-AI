<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;
use Throwable;

class ChatbotController extends Controller
{
    public function chat(Request $request): JsonResponse
    {
        $customer = $request->user();

        if (!$customer || $customer->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Customer access only. Please log in with a customer account.',
            ], 403);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer'],
        ]);

        $userMessage = trim($validated['message']);

        if (!empty($validated['conversation_id'])) {
            $conversation = Conversation::where('user_id', $customer->id)
                ->find($validated['conversation_id']);

            if (!$conversation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Conversation not found.',
                ], 404);
            }
        } else {
            $conversation = Conversation::create([
                'user_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'status' => 'open',
                'last_message_at' => now(),
            ]);
        }

        $conversation->messages()->create([
            'sender_type' => 'customer',
            'message' => $userMessage,
        ]);

        $history = $conversation->messages()
            ->latest('id')
            ->take(11)
            ->get()
            ->reverse()
            ->values();

        // Retrieve room information directly from MySQL.
        $rooms = Room::query()
            ->get()
            ->map(function ($room) {
                return [
                    'room_type' => $room->room_type ?? $room->name ?? 'Room',
                    'room_number' => $room->room_number,
                    'price_per_night' => $room->price_per_night,
                    'capacity' => $room->capacity,
                    'is_available' => (bool) $room->is_available,
                ];
            })
            ->values()
            ->all();

        $roomInformation = json_encode(
            $rooms,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );

        $systemPrompt = "
You are SmartStay AI, the official virtual hotel assistant.

CURRENT ROOM INFORMATION FROM THE DATABASE:
{$roomInformation}

YOUR RESPONSIBILITIES:
- Help customers understand room types, prices, and capacities.
- Explain the hotel reservation process.
- Answer questions about check-in, check-out, and cancellations.
- Help customers choose suitable rooms.

IMPORTANT RULES:
1. Always use the supplied database information when answering questions about rooms.
2. When a customer asks how much a room costs, immediately list the room types and their exact prices per night from the database.
3. Do not tell customers to visit the Rooms page just to see prices when the prices are already provided above.
4. Display prices in Philippine pesos (₱).
5. Include room capacity when available.
6. Never invent room prices, room types, amenities, or room details.
7. The is_available field does not guarantee availability for selected dates. Customers must check their dates on the Rooms page.
8. Direct customers to the Rooms page to make reservations.
9. Never claim a booking is confirmed unless the booking system confirms it.
10. Direct customers to My Bookings to manage reservations.
11. Never disclose another customer's personal information or booking details.
12. Never request passwords, authentication tokens, or payment card details.
13. Be friendly, professional, concise, and use simple English.
14. If room information is unavailable, politely recommend contacting the hotel administrator.

For price questions, use this format:

Here are our room rates per night:

- Deluxe Room – ₱[actual database price]
- Suite Room – ₱[actual database price]
- Family Room – ₱[actual database price]

Only include room types that exist in the supplied database information.
";

        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt,
            ],
        ];

        foreach ($history as $historyMessage) {
            $messages[] = [
                'role' => $historyMessage->sender_type === 'customer'
                    ? 'user'
                    : 'assistant',
                'content' => $historyMessage->message,
            ];
        }

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => $messages,
                'temperature' => 0.2,
                'max_tokens' => 500,
            ]);

            $reply = $response->choices[0]->message->content
                ?? $this->getFallbackReply($userMessage);

            $source = 'ai';
        } catch (Throwable $e) {
            Log::error('SmartStay AI chatbot error', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversation->id,
            ]);

            $reply = $this->getFallbackReply($userMessage);
            $source = 'fallback';
        }

        $conversation->messages()->create([
            'sender_type' => 'ai',
            'message' => $reply,
        ]);

        $conversation->update([
            'last_message_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'source' => $source,
            'conversation_id' => $conversation->id,
            'reply' => $reply,
        ]);
    }

    private function getFallbackReply(string $message): string
    {
        $message = strtolower($message);

        if (
            str_contains($message, 'price') ||
            str_contains($message, 'cost') ||
            str_contains($message, 'rate') ||
            str_contains($message, 'how much')
        ) {
            $rooms = Room::query()
                ->select('room_type', 'price_per_night', 'capacity')
                ->get()
                ->unique('room_type')
                ->values();

            if ($rooms->isEmpty()) {
                return 'Sorry, I cannot retrieve our room prices right now. Please contact our hotel administrator.';
            }

            $reply = "Here are our room rates per night:\n\n";

            foreach ($rooms as $room) {
                $roomType = $room->room_type ?? 'Room';
                $price = number_format((float) $room->price_per_night, 2);

                $reply .= "- {$roomType} Room – ₱{$price}";

                if ($room->capacity) {
                    $reply .= " (Up to {$room->capacity} guests)";
                }

                $reply .= "\n";
            }

            return $reply;
        }

        if (
            str_contains($message, 'check in') ||
            str_contains($message, 'check-in')
        ) {
            return 'For check-in information, please refer to your booking confirmation or contact our hotel administrator.';
        }

        if (
            str_contains($message, 'check out') ||
            str_contains($message, 'check-out')
        ) {
            return 'For check-out information, please refer to your booking confirmation or contact our hotel administrator.';
        }

        if (
            str_contains($message, 'book') ||
            str_contains($message, 'reservation')
        ) {
            return 'You can make a reservation through our Rooms page. Log in, select your dates, choose an available room, and complete the booking form.';
        }

        if (str_contains($message, 'cancel')) {
            return 'For reservation cancellation, visit the My Bookings page and follow the cancellation instructions.';
        }

        if (
            str_contains($message, 'room') ||
            str_contains($message, 'available')
        ) {
            return 'Please visit our Rooms page and enter your check-in and check-out dates to check actual room availability.';
        }

        if (
            str_contains($message, 'hello') ||
            str_contains($message, 'hi') ||
            str_contains($message, 'good morning') ||
            str_contains($message, 'good afternoon') ||
            str_contains($message, 'good evening')
        ) {
            return 'Hello! Welcome to SmartStay AI. How can I help you with your hotel reservation today?';
        }

        return 'Thank you for contacting SmartStay! I cannot answer that question right now. Please contact our hotel administrator for further assistance.';
    }
}