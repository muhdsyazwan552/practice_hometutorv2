<?php

namespace App\Http\Controllers\Web;
use App\Http\Controllers\Controller;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Models\School;
use App\Models\Level;
use App\Models\Student;
use App\Models\QuizSession;
use App\Models\User;
use App\Models\Friend;
use App\Models\FriendRequest;
use App\Models\ZoomMeeting;
use App\Models\Subject;
use App\Models\Topic;
use App\Models\DashboardTheme;
use App\Helpers\LevelHelper;
use App\Services\StreakService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
public function index()
{
    // DEBUG: Log semua language sources
    Log::info('=== DASHBOARD LANGUAGE DEBUG START ===');
    Log::info('Session locale:', ['value' => Session::get('locale')]);
    Log::info('User language:', ['value' => Auth::check() ? Auth::user()->language : 'guest']);
    Log::info('Current App locale:', ['value' => App::getLocale()]);
    Log::info('Request has locale?', ['value' => request()->has('locale')]);
    
    // ⭐⭐⭐ CRITICAL FIX: ALWAYS get locale from Session first
    $locale = Session::get('locale', 'en');
    
    // ⭐⭐⭐ CRITICAL FIX: ALWAYS set app locale
    App::setLocale($locale);
    
    // ⭐⭐⭐ CRITICAL FIX: ALWAYS load translations
    $translations = $this->loadPhpTranslations($locale);
    
    Log::info('Final language settings:', [
        'selected_locale' => $locale,
        'translations_count' => count($translations),
        'sample_translation' => $translations['dashboard']['school'] ?? 'NOT FOUND'
    ]);
    
    // Check if user is authenticated
    if (Auth::check()) {
        $user = Auth::user();
        $user->load('student');

        $unlockedThemes = $user->unlockedDashboardThemes()
            ->where('dashboard_themes.is_active', true)
            ->orderBy('dashboard_themes.sort_order')
            ->get();
        $dashboardTheme = $unlockedThemes->firstWhere('id', $user->active_dashboard_theme_id)
            ?? $unlockedThemes->first();
        $learningSpaceCardTheme = $unlockedThemes->firstWhere('id', $user->learning_space_card_theme_id)
            ?? $dashboardTheme;
        
       if ($user->language) {
            $userLang = $user->language;  
            
            if ($userLang !== $locale) {
                $user->update(['language' => $locale]);  
                
                Log::info('Language synced:', [
                    'user_was' => $userLang,
                    'user_now' => $locale,
                    'session_is' => $locale
                ]);
            }
        }
        
        // Get the student profile data
        $student = Student::with(['school', 'level'])
            ->where('user_id', $user->id)
            ->first();

        $streaks = app(StreakService::class)->summary($user->id);

        $quizAgg = QuizSession::where('user_id', $user->id)
            ->selectRaw('COUNT(*) as attempts, AVG(total_correct) as avg_correct, MAX(total_correct) as best_correct')
            ->first();
        $quizStats = [
            'attempts' => (int) ($quizAgg->attempts ?? 0),
            'averageScore' => $quizAgg && $quizAgg->attempts ? (int) round($quizAgg->avg_correct * 20) : 0,
            'bestScore' => $quizAgg->best_correct !== null ? (int) $quizAgg->best_correct : null,
        ];

        $friendsCount = Friend::where('user_id', $user->id)->orWhere('friend_id', $user->id)->count();
        $pendingRequestsCount = FriendRequest::where('receiver_id', $user->id)->where('status', 'pending')->count();

        // Prepare profile data from student information
        $profileData = [
            'name' => $student ? $student->name : $user->name,
            'email' => $student ? $student->email : $user->email,
            'school' => $student && $student->school ? $student->school->name : 'Add your school',
            'grade' => $student->class_name ?? 'Form 5',
            'display_name' => $student ? $student->display_name : $user->display_name,
            'profile_picture' => $user->profile_picture ?? null,
        ];

        $authData = ['user' => $user];

    } else {
        // For non-authenticated users
        $profileData = [
            'name' => 'Guest User',
            'email' => 'guest@example.com',
            'school' => 'Not specified',
            'grade' => 'Form 5',
            'display_name' => 'Guest'
        ];

        $streaks = [
            'login' => 0,
            'questions' => 0,
            'answersToday' => 0,
            'longestLogin' => 0,
            'longestQuestions' => 0,
            'lastLoginDate' => null,
            'lastAnswerDate' => null,
        ];
        $quizStats = ['attempts' => 0, 'averageScore' => 0, 'bestScore' => null];
        $friendsCount = 0;
        $pendingRequestsCount = 0;
        $student = null;
        $authData = null;
    }

    $activityCalendar = $this->buildActivityCalendar(Auth::check() ? Auth::id() : null);

    // Same "display level" collapsing used by MenuController::getSchoolSubjects()
    // (e.g. Form 4/5 both practice under the level_id=10 subject set) — using
    // the raw student level_id here would look up a subject list the student
    // never actually practices against, so progress always showed as 0.
    $subjectLevelId = LevelHelper::getStandardLevelId($student?->level_id ?? 7);
    $subjectRows = Subject::query()
        ->where('level_id', $subjectLevelId)
        ->where('is_active', true)
        ->orderBy('seq')
        ->get(['id', 'name', 'abbr', 'level_id']);

    $courses = $this->buildCourseProgress($subjectRows, Auth::check() ? Auth::id() : null);

    $teachers = [[
        'name' => 'Cikgu Aina',
        'image' => '/images/cikgu-aina.png',
        'subjects' => collect($courses)->pluck('title')->take(2)->values()->all() ?: ['Mathematics', 'Science'],
        'message' => 'Let’s learn one small step at a time!',
        'available' => 'Ready to guide you',
    ]];

    $assignments = [
        [
            'title' => "New Assignment",
            'dueDate' => "Due Jun 26th, 11:59 PM",
            'topic' => "Nombor Dan Operasi",
            'description' => "Objective - Same question set"
        ]
    ];

    $zoomMeetings = ZoomMeeting::query()
        ->where('is_active', true)
        ->where('ends_at', '>=', now()->subMinutes(config('zoom.join_window.minutes_after', 30)))
        ->where('starts_at', '<=', now()->addDays(7))
        ->orderBy('starts_at')
        ->get()
        ->map(fn (ZoomMeeting $meeting) => [
            'id' => $meeting->id,
            'title' => $meeting->title,
            'startsAt' => $meeting->starts_at->toIso8601String(),
            'endsAt' => $meeting->ends_at->toIso8601String(),
            'canJoin' => $meeting->isJoinableAt(now()),
            'joinUrl' => route('zoom.meetings.join', $meeting),
        ]);
    
    Log::info('=== DASHBOARD LANGUAGE DEBUG END ===');
    Log::info('Returning to Inertia:', [
        'locale' => $locale,
        'has_translations' => !empty($translations),
        'auth_user_id' => Auth::check() ? Auth::id() : null
    ]);
    
        return Inertia::render('Dashboard', [
        'title' => 'Dashboard',
        'profileData' => $profileData,
        'student' => $student,
        'courses' => $courses,
        'assignments' => $assignments,
        'zoomMeetings' => $zoomMeetings,
        'streaks' => $streaks,
        'teachers' => $teachers,
        'auth' => $authData,
        'locale' => $locale, 
        'translations' => $translations, 
            'availableLocales' => ['en', 'ms'],
            'dashboardTheme' => $this->themePayload($dashboardTheme),
            'learningSpaceCardTheme' => $this->themePayload($learningSpaceCardTheme),
            'activityCalendar' => $activityCalendar,
            'quizStats' => $quizStats,
            'friendsCount' => $friendsCount,
            'pendingRequestsCount' => $pendingRequestsCount,
        ]);
}

/**
 * Attach real practice progress to each subject: how many main topics the
 * student has completed at least one practice session for, out of how
 * many main topics exist for that subject/level.
 */
private function buildCourseProgress($subjectRows, ?int $userId): array
{
    if ($subjectRows->isEmpty()) {
        return [];
    }

    $subjectIds = $subjectRows->pluck('id');

    $totalTopicsBySubject = Topic::query()
        ->whereIn('subject_id', $subjectIds)
        ->where('parent_id', 0)
        ->where('is_active', true)
        ->selectRaw('subject_id, COUNT(*) as total')
        ->groupBy('subject_id')
        ->pluck('total', 'subject_id');

    $answeredTopicsBySubject = $userId
        ? DB::table('practice_session')
            ->where('user_id', $userId)
            ->whereIn('subject_id', $subjectIds)
            ->whereNotNull('topic_id')
            ->selectRaw('subject_id, COUNT(DISTINCT topic_id) as answered')
            ->groupBy('subject_id')
            ->pluck('answered', 'subject_id')
        : collect();

    return $subjectRows->map(function (Subject $subject) use ($totalTopicsBySubject, $answeredTopicsBySubject) {
        $total = (int) ($totalTopicsBySubject[$subject->id] ?? 0);
        $answered = min((int) ($answeredTopicsBySubject[$subject->id] ?? 0), $total);
        $percentage = $total > 0 ? (int) round(($answered / $total) * 100) : 0;

        return [
            'id' => $subject->id,
            'title' => $subject->name,
            'name' => $subject->name,
            'abbr' => $subject->abbr,
            'level_id' => $subject->level_id,
            'topicsAnswered' => $answered,
            'topicsTotal' => $total,
            'progressPercentage' => $percentage,
        ];
    })->values()->all();
}

/**
 * Build the 3-month (current month + previous 2 months) activity calendar
 * payload: which months to render, and which dates the user logged in /
 * completed a practice session on, so the dashboard can highlight them.
 */
private function buildActivityCalendar(?int $userId): array
{
    $rangeStart = now()->subMonths(2)->startOfMonth();
    $rangeEnd = now()->endOfMonth();

    $months = collect(range(2, 0))
        ->map(fn ($monthsAgo) => now()->subMonths($monthsAgo))
        ->map(fn (Carbon $date) => [
            'year' => $date->year,
            'month' => $date->month,
            'label' => $date->translatedFormat('F Y'),
            'daysInMonth' => $date->daysInMonth,
            // 0 (Sunday) - 6 (Saturday) weekday of the 1st, used by the frontend to pad the grid
            'firstWeekday' => (int) $date->copy()->startOfMonth()->format('w'),
        ])
        ->values()
        ->all();

    if (! $userId) {
        return [
            'months' => $months,
            'loginDates' => [],
            'practiceDates' => [],
        ];
    }

    $loginDates = DB::table('login_activity_logs')
        ->where('user_id', $userId)
        ->whereBetween('logged_in_at', [$rangeStart, $rangeEnd])
        ->selectRaw('DISTINCT DATE(logged_in_at) as d')
        ->pluck('d')
        ->map(fn ($d) => (string) $d)
        ->values()
        ->all();

    $practiceDates = DB::table('practice_session')
        ->where('user_id', $userId)
        ->whereBetween('start_at', [$rangeStart, $rangeEnd])
        ->whereNotNull('start_at')
        ->selectRaw('DISTINCT DATE(start_at) as d')
        ->pluck('d')
        ->map(fn ($d) => (string) $d)
        ->values()
        ->all();

    return [
        'months' => $months,
        'loginDates' => $loginDates,
        'practiceDates' => $practiceDates,
    ];
}

private function themePayload(?DashboardTheme $theme): ?array
{
    if (!$theme) {
        return null;
    }

    return [
        'id' => $theme->id,
        'slug' => $theme->slug,
        'name' => $theme->name,
        'description' => $theme->description,
        'preview_image_path' => $theme->preview_image_path,
        'config' => $theme->config ?? [],
    ];
}

private function loadPhpTranslations($locale)
{
    $fallbackLocale = 'en';
    
    try {
        // Load the dashboard.php file for the requested locale
        $translations = trans('common', [], $locale);
        
        // If no translations found, try fallback
        if (is_array($translations) && !empty($translations)) {
            return $translations;
        }
        
        // Fallback to English
        return trans('common', [], $fallbackLocale);
        
    } catch (\Exception $e) {
        // If translation file doesn't exist, return empty
        Log::error('Failed to load translations: ' . $e->getMessage());
        return [];
    }
}
    /**
     * Get friends data for the current user
     */
    private function getFriendsData($user)
    {
        return Friend::where('user_id', $user->id)
            ->orWhere('friend_id', $user->id)
            ->with(['user.student.school', 'friend.student.school'])
            ->get()
            ->map(function ($friend) use ($user) {
                // Determine if the user is the initiator or receiver
                $friendUser = $friend->user_id == $user->id ? $friend->friend : $friend->user;
                
                return [
                    'id' => $friend->id,
                    'friend_id' => $friendUser->id,
                    'name' => $friendUser->display_name ?? $friendUser->name,
                    'avatar' => $this->getAvatarInitials($friendUser->display_name ?? $friendUser->name),
                    'avatarColor' => $this->getAvatarColor($friendUser->id),
                    'status' => 'online', // You can implement actual online status logic
                    'mutualFriends' => $this->getMutualFriendsCount($user->id, $friendUser->id),
                    'school' => $friendUser->student->school->name ?? 'Unknown School',
                ];
            });
    }

    /**
     * Get pending friend requests for the current user
     */
    private function getPendingRequests($user)
    {
        return FriendRequest::where('receiver_id', $user->id)
            ->where('status', 'pending')
            ->with(['user.student.school'])
            ->get()
            ->map(function ($request) use ($user) {
                return [
                    'id' => $request->id,
                    'requester_id' => $request->requester_id,
                    'name' => $request->user->display_name ?? $request->user->name,
                    'avatar' => $this->getAvatarInitials($request->user->display_name ?? $request->user->name),
                    'mutualFriends' => $this->getMutualFriendsCount($user->id, $request->requester_id),
                ];
            });
    }

    /**
     * Get mutual friends count between two users
     */
    private function getMutualFriendsCount($userId1, $userId2)
    {
        $user1Friends = Friend::where('user_id', $userId1)
            ->orWhere('friend_id', $userId1)
            ->get()
            ->map(function ($friend) use ($userId1) {
                return $friend->user_id == $userId1 ? $friend->friend_id : $friend->user_id;
            })
            ->toArray();

        $user2Friends = Friend::where('user_id', $userId2)
            ->orWhere('friend_id', $userId2)
            ->get()
            ->map(function ($friend) use ($userId2) {
                return $friend->user_id == $userId2 ? $friend->friend_id : $friend->user_id;
            })
            ->toArray();

        $mutualFriends = array_intersect($user1Friends, $user2Friends);
        
        return count($mutualFriends);
    }

    /**
     * Generate avatar initials from name
     */
    private function getAvatarInitials($name)
    {
        return collect(explode(' ', $name))
            ->map(fn($word) => strtoupper(substr($word, 0, 1)))
            ->take(2)
            ->join('');
    }

    /**
     * Generate consistent avatar color based on user ID
     */
    private function getAvatarColor($userId)
    {
        $colors = [
            'bg-gradient-to-r from-blue-400 to-purple-500',
            'bg-gradient-to-r from-green-400 to-teal-500',
            'bg-gradient-to-r from-pink-400 to-red-500',
            'bg-gradient-to-r from-yellow-400 to-orange-500',
            'bg-gradient-to-r from-indigo-400 to-blue-500',
        ];

        return $colors[$userId % count($colors)];
    }
    
    /**
     * Get user statistics for dashboard
     */
    public function getUserStats()
    {
        $user = Auth::user();

        // Get user's quiz performance
        $userQuizSessions = QuizSession::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalQuizzes = $userQuizSessions->count();
        $averageScore = $userQuizSessions->avg('total_correct');
        $bestScore = $userQuizSessions->max('total_correct');

        // Get user's rank
        $userRank = $this->calculateUserRank($user->id);

        return [
            'totalQuizzes' => $totalQuizzes,
            'averageScore' => round($averageScore, 1),
            'bestScore' => $bestScore,
            'currentRank' => $userRank,
        ];
    }

    /**
     * Calculate user's rank based on quiz performance
     */
    private function calculateUserRank($userId)
    {
        // Get all users with their best scores and fastest times
        $rankedUsers = QuizSession::select('user_id')
            ->selectRaw('MAX(total_correct) as best_score')
            ->selectRaw('MIN(total_time_seconds) as best_time')
            ->groupBy('user_id')
            ->orderBy('best_score', 'desc')
            ->orderBy('best_time', 'asc')
            ->get();

        $rank = 1;
        foreach ($rankedUsers as $rankedUser) {
            if ($rankedUser->user_id == $userId) {
                return $rank;
            }
            $rank++;
        }

        return null; // User not found in rankings
    }

    /**
     * Get leaderboard data with pagination
     */
    public function getLeaderboard(Request $request)
    {
        $perPage = $request->get('per_page', 20);
        
        $leaderboard = QuizSession::with('school', 'user')
            ->select('user_id')
            ->selectRaw('MAX(total_correct) as best_score')
            ->selectRaw('MIN(total_time_seconds) as best_time')
            ->selectRaw('COUNT(*) as quiz_count')
            ->groupBy('user_id')
            ->orderBy('best_score', 'desc')
            ->orderBy('best_time', 'asc')
            ->paginate($perPage);

        return response()->json($leaderboard);
    }

    /**
     * Get recent activity for dashboard
     */
    public function getRecentActivity()
    {
        $user = Auth::user();

        $recentQuizzes = QuizSession::with('school')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($quiz) {
                return [
                    'type' => 'quiz',
                    'title' => 'Quiz Completed',
                    'description' => "Scored {$quiz->total_correct}/5 in {$quiz->total_time_seconds} seconds",
                    'date' => $quiz->created_at->diffForHumans(),
                    'score' => $quiz->total_correct,
                    'time' => $quiz->total_time_seconds,
                ];
            });

        return $recentQuizzes;
    }
}
