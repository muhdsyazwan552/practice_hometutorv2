<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $table = 'subject';
    protected $primaryKey = 'id';
    public $timestamps = true;

    protected $fillable = [
        'old_id',
        'group_id',
        'abbr',
        'name',
        'level_id',
        'seq',
        'is_active',
        'modified_by',
        'created_by',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Only subject/level rows that actually have topics. Some rows exist with
     * no content (e.g. Geografi Form 4/5), and should not be offered to pupils.
     */
    public function scopeHasTopics($query)
    {
        return $query->whereExists(
            fn ($topics) => $topics->selectRaw('1')->from('topics')->whereColumn('topics.subject_id', 'subject.id')
        );
    }

    /** Relationships */
    public function topics()
    {
        return $this->hasMany(Topic::class, 'subject_id', 'id');
    }
}
