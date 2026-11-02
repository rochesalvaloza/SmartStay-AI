<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
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
        'access_token_hash',

        // Payment fields
        'payment_method',
        'payment_status',
        'payment_reference',
        'payment_proof_path',
        'payment_verified_at',
        'payment_rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'check_in' => 'date',
            'check_out' => 'date',
            'check_in_time' => 'string',
            'check_out_time' => 'string',
            'guests' => 'integer',
            'total_price' => 'decimal:2',
            'payment_verified_at' => 'datetime',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}