<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameSsoAuthorizationCode extends Model
{
    protected $fillable = ['code_hash', 'state_hash', 'user_id', 'role', 'audience', 'expires_at', 'used_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
