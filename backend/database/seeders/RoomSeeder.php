<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        $rooms = [
            [
                'name' => 'Deluxe Room',
                'room_type' => 'Deluxe',
                'description' => 'A comfortable room for couples or solo travelers.',
                'price_per_night' => 2500,
                'capacity' => 2,
                'image_url' => 'https://images.unsplash.com/photo-1611892440504-42a792e24d32',
                'is_available' => true,
            ],
            [
                'name' => 'Executive Suite',
                'room_type' => 'Suite',
                'description' => 'A spacious suite designed for a relaxing stay.',
                'price_per_night' => 4500,
                'capacity' => 3,
                'image_url' => 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
                'is_available' => true,
            ],
            [
                'name' => 'Family Room',
                'room_type' => 'Family',
                'description' => 'A welcoming room for families and small groups.',
                'price_per_night' => 3800,
                'capacity' => 4,
                'image_url' => 'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
                'is_available' => true,
            ],
        ];

        foreach ($rooms as $room) {
            Room::updateOrCreate(
                ['name' => $room['name']],
                $room
            );
        }
    }
}