<?php

namespace App\Http\Controllers\Web;
use App\Http\Controllers\Controller;

use App\Models\Subject;
use App\Models\Topic;
use App\Models\Level;
use App\Models\Question;
use App\Models\Answer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use App\Traits\InertiaLocaleTrait;
use App\Helpers\LevelHelper;
use App\Services\MasteryService;

class MissionController extends Controller
{
    use InertiaLocaleTrait;

    public function __construct(private MasteryService $masteryService)
    {
    }

    /**
     * Display the mission page for a subject
     */
    public function index(Request $request, $subject)
    {
        $subjectId = $request->get('subject_id');
        $levelId = $request->get('level_id');
        $form = $request->get('form');

        $userId = Auth::id();
        $user = Auth::user();
        $user?->load('student');
        $studentLevelId = $user?->student?->level_id;
        $availableForms = LevelHelper::getAvailableFormsForSubject($user, $subject);

        if (! in_array($form, $availableForms, true)) {
            $form = $availableForms[0];
        }

        $locale = Session::get('locale', 'en');
        App::setLocale($locale);

        // Load translations
        $translations = $this->loadPhpTranslations($locale);
        
        Log::info('ReportPage Request:', [
            'subject_param' => $subject,
            'subject_id' => $subjectId,
            'level_id' => $levelId,
            'form' => $form,
        ]);

        // Get available levels
        $availableLevels = Level::where('is_active', true)
            ->whereIn('name', $availableForms)
            ->get(['id', 'name', 'abbr'])
            ->mapWithKeys(function ($level) {
                return [$level->name => $level->id];
            })
            ->toArray();

        // Get available subjects
        $availableSubjects = Subject::where('abbr', $subject)
            ->whereIn('level_id', array_values($availableLevels))
            ->where('is_active', true)
            ->get(['id', 'abbr', 'name', 'level_id'])
            ->mapWithKeys(function ($subject) use ($availableLevels) {
                $levelName = array_search($subject->level_id, $availableLevels);
                return [$levelName => $subject->id];
            })
            ->toArray();

        // If form is provided, prioritize it over existing IDs
        if ($form && isset($availableLevels[$form])) {
            $newLevelId = $availableLevels[$form];
            
            if ($newLevelId != $levelId) {
                $levelId = $newLevelId;
                
                if (isset($availableSubjects[$form])) {
                    $subjectId = $availableSubjects[$form];
                    Log::info('Auto-updated subject and level based on form:', [
                        'form' => $form, 
                        'level_id' => $levelId, 
                        'subject_id' => $subjectId
                    ]);
                }
            }
        }

        // Validate required parameters
        if (!$subjectId || !$levelId) {
            Log::error('Missing parameters', [
                'subject_id' => $subjectId, 
                'level_id' => $levelId,
                'available_subjects' => $availableSubjects,
                'available_levels' => $availableLevels
            ]);
            abort(400, 'Missing required parameters: subject_id and level_id are required');
        }

        // Get subject details
        $subjectData = Subject::find($subjectId);

        if (!$subjectData) {
            Log::error('Subject not found', ['subject_id' => $subjectId]);
            abort(404, 'Subject not found');
        }

        Session::put('current_course_form', $form);

        $topics = $this->masteryService->getTopicsWithMastery($userId, $subjectId, $levelId);
        $initialProgress = $this->masteryService->getMissionProgress($userId, $subjectId, $levelId, $topics);
        $initialSkills = $this->masteryService->getMissionSubtopics($userId, $subjectId, $levelId, $topics)->values();
        $initialChallenge = [
            'title' => 'Mastery Challenge',
            'description' => "Strengthen skills you've already practiced",
            'question_count' => $this->masteryService->getQuestionsPerSession(),
        ];

        // Get topics dengan structure yang benar
       

        return Inertia::render('courses/SubjectMissionPage', [
            'subject' => $subjectData->name,
            'subject_abbr' => $subjectData->name,
            'subject_id' => $subjectId,
            'level_id' => $levelId,
            'form' => $form,
            
            'selectedStandard' => $form,
            'initialProgress' => $initialProgress,
            'initialSkills' => $initialSkills,
            'initialChallenge' => $initialChallenge,
            'availableForms' => $availableForms,
            'availableLevels' => $availableLevels,
            'availableSubjects' => $availableSubjects,

            'locale' => $locale,
            'translations' => $translations,
            'availableLocales' => ['en', 'ms'],
        ]);
    }

    /**
     * Full-page subtopic mission (replaces the old modal).
     * GET /mission/subtopic/{topic}
     */
    public function subtopicPage(Request $request, int $topic)
    {
        $topicRow = DB::table('topics')->find($topic);
        abort_unless($topicRow, 404);

        $subject = Subject::find($topicRow->subject_id);
        abort_unless($subject, 404);

        $level = Level::find($topicRow->level_id);
        $locale = Session::get('locale', 'en');
        App::setLocale($locale);

        $form = $request->get('form', $level->name ?? null);
        $subjectKey = $request->get('subject', $subject->name);
        $backUrl = route('subject-mission-page', [
            'subject' => $subjectKey,
            'form' => $form,
            'level_id' => $topicRow->level_id,
            'subject_id' => $topicRow->subject_id,
        ]);

        // The mission is created from the list page first; opening this page
        // without one of the student's own unfinished sessions goes back there.
        $sessionId = (int) $request->get('session_id');
        $hasSession = $sessionId > 0 && DB::table('practice_session')
            ->where('id', $sessionId)
            ->where('user_id', Auth::id())
            ->where('session_type', 'mission')
            ->where('status', 'in_progress')
            ->exists();
        if (! $hasSession) {
            return redirect($backUrl);
        }

        return $this->renderWithLocale('courses/SubtopicMissionPage', [
            'subject' => $subjectKey,
            'subject_id' => (int) $topicRow->subject_id,
            'level_id' => (int) $topicRow->level_id,
            'form' => $form,
            'topic_id' => (int) $topicRow->id,
            'topic_name' => $topicRow->name,
            'session_id' => $sessionId,
            'back_url' => $backUrl,
        ]);
    }

        private function loadPhpTranslations($locale)
{
    $fallbackLocale = 'en';
    
    try {
        // Load the common.php file for the requested locale
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
}
