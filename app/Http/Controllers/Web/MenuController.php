<?php
namespace App\Http\Controllers\Web;
use App\Http\Controllers\Controller;

use App\Models\Subject;
use App\Models\Student;
use App\Helpers\LevelHelper;
use Illuminate\Support\Facades\Auth;

class MenuController extends Controller
{
    public function getSchoolSubjects()
    {
        // Get the authenticated user
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }
        
        // Get the student record for the user
        $student = Student::where('user_id', $user->id)->first();
        
        if (!$student) {
            return []; // Return empty array if no student found
        }
        
        $levelId = $student->level_id;

        // Use the helper to get the standard level_id
        $standardLevelId = LevelHelper::getStandardLevelId($levelId);

        // Full-access accounts see every subject once, preferring the copy at
        // their own level; the subject page lets them switch form from there.
        if ($user->hasFullAccess()) {
            return Subject::where('is_active', true)
                ->hasTopics()
                ->select('id', 'name', 'level_id', 'abbr', 'seq')
                ->orderByRaw('level_id = ? DESC', [$standardLevelId])
                ->orderBy('level_id')
                ->get()
                ->unique('abbr')
                ->sortBy('seq')
                ->values()
                ->toArray();
        }

        // Return ONLY the array of subjects
        return Subject::where('is_active', true)
            ->hasTopics()
            ->where('level_id', $standardLevelId)
            ->select('id', 'name', 'level_id', 'abbr', 'seq')
            ->orderBy('seq')
            ->get()
            ->toArray();
    }
}
