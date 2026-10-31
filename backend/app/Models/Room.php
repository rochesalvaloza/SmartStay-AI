<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id',
    'room_id',
    'room_number',
    'guest_name',
    'guest_email',
    'check_in',
    'check_in_time',
    'check_out',
    'check_out_time',
    'guests',
    'total_price',
    'status',
];

    protected function casts(): array
    {
        return [
            'price_per_night' => 'decimal:2',
            'capacity' => 'integer',
            'is_available' => 'boolean',
        ];
    }

    public function bookings()
{
    return $this->hasMany(\App\Models\Booking::class);
}
}