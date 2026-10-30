<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\MasteryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Services\StreakService;
use App\Support\QuestionContentNormalizer;


class ChallengeController extends Controller
{
    protected $masteryService;

    public function __construct(MasteryService $masteryService)
    {
        $this->masteryService = $masteryService;
    }

    /**
     * A session the signed-in student owns; another student's id behaves like an unknown one.
     */
    private function ownedSession($sessionId): ?object
    {
        return DB::table('practice_session')
            ->where('id', $sessionId)
            ->where('user_id', Auth::id())
            ->where('session_type', 'mission')
            ->select('practice_session.*')
            ->selectRaw('total_correct as correct_answers, start_at as started_at, end_at as completed_at')
            ->first();
    }

    /**
     * Start a new mastery challenge session
     * POST /mission/challenge/start
     */

    public function startChallenge(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer',
            'level_id' => 'required|integer'
        ]);

        $userId = Auth::id();
        
        if (!$userId) {
            Log::error('User not authenticated in startChallenge');
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        $subjectId = $request->subject_id;
        $levelId = $request->level_id;

        Log::info('Starting challenge', [
            'user_id' => $userId,
            'subject_id' => $subjectId,
            'level_id' => $levelId
        ]);

        // Check if there's an active session
        $activeSession = DB::table('practice_session')
            ->where('user_id', $userId)
            ->where('subject_id', $subjectId)
            ->where('level_id', $levelId)
            ->where('session_type', 'mission')
            ->where('mission_scope', 'subject')
            ->where('status', 'in_progress')
            ->first();

        if ($activeSession) {
            $storedQuestionCount = DB::table('mastery_challenge_questions')
                ->where('session_id', $activeSession->id)
                ->count();
            $objectiveQuestionCount = DB::table('mastery_challenge_questions as mcq')
                ->join('questions as q', 'mcq.question_id', '=', 'q.id')
                ->where('mcq.session_id', $activeSession->id)
                ->where('q.question_type_id', 1)
                ->count();

            if ($storedQuestionCount === 10 && $storedQuestionCount === $objectiveQuestionCount) {
                Log::info('Continuing existing challenge session', ['session_id' => $activeSession->id]);
                return response()->json([
                    'session_id' => $activeSession->id,
                    'total_questions' => $activeSession->total_questions,
                    'message' => 'Continuing existing challenge'
                ]);
            }

            if ($storedQuestionCount > 0) {
                DB::table('practice_session')
                    ->where('id', $activeSession->id)
                    ->update(['status' => 'abandoned', 'updated_at' => now()]);
                $activeSession = null;
            }
        }

        $questionCount = 10;

        // Generate questions for the challenge
        $questionIds = $this->masteryService->generateChallengeQuestions(
            $userId,
            $subjectId,
            $levelId,
            $questionCount
        );

        if (count($questionIds) < $questionCount) {
            return response()->json([
                'error' => 'Not enough questions available',
                'message' => 'A mission requires 10 available questions.'
            ], 400);
        }

        // Create new session if needed
        if (!$activeSession) {
            $firstTopicId = DB::table('questions')->where('id', $questionIds[0])->value('topic_id');
            $topicScope = $this->masteryService->resolveTopicScope((int) $firstTopicId);
            $sessionId = DB::table('practice_session')->insertGetId([
                'uuid' => (string) Str::uuid(),
                'user_id' => $userId,
                'subject_id' => $subjectId,
                'level_id' => $levelId,
                'topic_id' => $topicScope['topic_id'],
                'subtopic_id' => $topicScope['subtopic_id'],
                'question_type_id' => 1,
                'session_type' => 'mission',
                'mission_scope' => 'subject',
                'total_questions' => count($questionIds),
                'total_correct' => 0,
                'total_skipped' => count($questionIds),
                'score' => 0,
                'total_time_seconds' => 0,
                'status' => 'in_progress',
                'start_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $sessionId = $activeSession->id;
        }

        // Store the question set for this session
        foreach ($questionIds as $index => $questionId) {
            DB::table('mastery_challenge_questions')->insert([
                'session_id' => $sessionId,
                'question_id' => $questionId,
                'question_order' => $index + 1,
                'created_at' => now()
            ]);
        }

        Log::info('Challenge session created with questions', [
            'session_id' => $sessionId,
            'question_count' => count($questionIds)
        ]);

        return response()->json([
            'session_id' => $sessionId,
            'total_questions' => count($questionIds),
            'message' => 'Challenge started successfully'
        ]);
    }


    /**
     * Get next question for the challenge
     * GET /mission/challenge/question?session_id=X
     */
    public function getQuestion(Request $request)
    {
        $sessionId = $request->get('session_id');
        
        if (!$sessionId) {
            return response()->json(['error' => 'Session ID required'], 400);
        }

        $session = $this->ownedSession($sessionId);
        
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        if ($session->status !== 'in_progress') {
            return response()->json(['error' => 'Session is not active'], 400);
        }

        // Get already answered question IDs
        $answeredQuestionIds = DB::table('mastery_challenge_attempts')
            ->where('session_id', $sessionId)
            ->pluck('question_id')
            ->toArray();

        $answeredCount = count($answeredQuestionIds);

        Log::info('Getting next question', [
            'session_id' => $sessionId,
            'answered_count' => $answeredCount,
            'total_questions' => $session->total_questions
        ]);

        // Check if challenge is complete
        if ($answeredCount >= $session->total_questions) {
            return response()->json([
                'completed' => true,
                'message' => 'Challenge completed'
            ]);
        }

        // Get the next unanswered question from the session's question set
        $nextQuestion = DB::table('mastery_challenge_questions as mcq')
            ->join('questions as q', 'mcq.question_id', '=', 'q.id')
            ->where('mcq.session_id', $sessionId)
            ->where('q.question_type_id', 1)
            ->whereNotIn('mcq.question_id', $answeredQuestionIds)
            ->orderBy('mcq.question_order', 'asc')
            ->select('q.*', 'mcq.question_order')
            ->first();

        if (!$nextQuestion) {
            Log::warning('No next question found', [
                'session_id' => $sessionId,
                'answered_count' => $answeredCount
            ]);
            
            return response()->json([
                'completed' => true,
                'message' => 'No more questions available'
            ]);
        }

        // Get answers for the question
        $answers = DB::table('answers')
            ->where('question_id', $nextQuestion->id)
            ->where('isactive', 1)
            ->select(
                'id', 
                'answer_text', 
                'answer_option_file',
                'iscorrectanswer as is_correct_answer',
                'reason',
                'reason2',
                'reason_file'
            )
            ->inRandomOrder()
            ->get()
            ->map(fn ($answer) => QuestionContentNormalizer::answerRow($answer));

        Log::info('Returning question', [
            'question_id' => $nextQuestion->id,
            'question_order' => $nextQuestion->question_order,
            'answers_count' => $answers->count()
        ]);

            // Prepare question object
    $questionData = [
        'id' => $nextQuestion->id,
        'topic_id' => $nextQuestion->topic_id
    ];

    // Normalize both legacy inline placeholders and separate S3 question files.
    $questionHtml = QuestionContentNormalizer::questionHtml(
        $nextQuestion->question_text,
        $nextQuestion->question_file
    );
    if ($questionHtml) {
        $questionData['question_text'] = $questionHtml;
    }

    $questionFileUrl = QuestionContentNormalizer::questionFileUrl($nextQuestion->question_file);
    if ($questionFileUrl) {
        $questionData['question_file'] = $questionFileUrl;
    }


        return response()->json([
            'completed' => false,
            'current_question' => $answeredCount + 1,
            'total_questions' => $session->total_questions,
            'question' => $questionData,
            'answers' => $answers
        ]);
    }

    /**
     * Submit answer for a challenge question
     * POST /mission/challenge/answer
     */
    public function submitAnswer(Request $request)
    {
        $request->validate([
            'session_id' => 'required|integer',
            'question_id' => 'required|integer',
            'answer_id' => 'required|integer',
            'time_taken' => 'required|integer|min:0|max:3600'
        ]);

        $sessionId = $request->session_id;
        $questionId = $request->question_id;
        $answerId = $request->answer_id;
        $timeTaken = $request->time_taken;

        $session = $this->ownedSession($sessionId);
        
        if (!$session || $session->status !== 'in_progress') {
            return response()->json(['error' => 'Invalid session'], 400);
        }

        // Check if already answered
        $existingAttempt = DB::table('mastery_challenge_attempts')
            ->where('session_id', $sessionId)
            ->where('question_id', $questionId)
            ->first();

        if ($existingAttempt) {
            return response()->json(['error' => 'Question already answered'], 400);
        }

        // Get question details
        $question = DB::table('questions')->find($questionId);
        
        if (!$question) {
            return response()->json(['error' => 'Question not found'], 404);
        }

        if ((int) $question->question_type_id !== 1) {
            return response()->json(['error' => 'Mastery sessions only accept objective questions'], 422);
        }

        $inSession = DB::table('mastery_challenge_questions')
            ->where('session_id', $sessionId)
            ->where('question_id', $questionId)
            ->exists();

        if (!$inSession) {
            return response()->json(['error' => 'That question is not part of this session'], 422);
        }

        // Check if answer is correct (the answer must belong to this question)
        $answer = DB::table('answers')->where('id', $answerId)->where('question_id', $questionId)->first();
        $isCorrect = $answer && $answer->iscorrectanswer == 1;

        Log::info('Submitting answer', [
            'session_id' => $sessionId,
            'question_id' => $questionId,
            'answer_id' => $answerId,
            'is_correct' => $isCorrect
        ]);

        $topicScope = $this->masteryService->resolveTopicScope($question->topic_id);

        // Keep mastery on the exact learning scope: topic or child subtopic.
        $masteryUpdate = $this->masteryService->updateTopicMastery(
            $session->user_id,
            $question->topic_id,
            $session->subject_id,
            $session->level_id,
            $isCorrect,
            $timeTaken
        );

        // Record the attempt
        DB::table('mastery_challenge_attempts')->insert([
            'session_id' => $sessionId,
            'user_id' => $session->user_id,
            'question_id' => $questionId,
            'topic_id' => $question->topic_id,
            'subtopic_id' => $topicScope['subtopic_id'],
            'choosen_answer_id' => $answerId,
            'is_correct' => $isCorrect ? 1 : 0,
            'time_taken_seconds' => $timeTaken,
            'previous_mastery_level_id' => $masteryUpdate['previous_level'],
            'new_mastery_level_id' => $masteryUpdate['new_level'],
            'created_at' => now()
        ]);

        app(StreakService::class)->recordAnswer($session->user_id);

        // Update session stats
        if ($isCorrect) {
            DB::table('practice_session')
                ->where('id', $sessionId)
                ->increment('total_correct');
        }
        
        DB::table('practice_session')
            ->where('id', $sessionId)
            ->increment('total_time_seconds', $timeTaken);

        // Check if challenge is complete
        $answeredCount = DB::table('mastery_challenge_attempts')
            ->where('session_id', $sessionId)
            ->count();

        $challengeComplete = $answeredCount >= $session->total_questions;

        if ($challengeComplete) {
            DB::table('practice_session')
                ->where('id', $sessionId)
                ->update([
                    'status' => 'completed',
                    'end_at' => now(),
                    'updated_at' => now()
                ]);

            // Update progress cache
            $this->masteryService->updateProgressCache(
                $session->user_id,
                $session->subject_id,
                $session->level_id
            );

            Log::info('Challenge completed', ['session_id' => $sessionId]);

        }

        // Keep the shared report session current even when a mission is left early.
        $this->saveReportSessionData($sessionId);

        return response()->json([
            'is_correct' => $isCorrect,
            'mastery_changed' => $masteryUpdate['previous_level'] !== $masteryUpdate['new_level'],
            'previous_mastery' => $masteryUpdate['previous_level'],
            'new_mastery' => $masteryUpdate['new_level'],
            'challenge_complete' => $challengeComplete
        ]);
    }



    /**
     * Get challenge summary/results
     * GET /mission/challenge/summary?session_id=X
     */
    public function getSummary(Request $request)
    {
        $sessionId = $request->get('session_id');
        
        if (!$sessionId) {
            return response()->json(['error' => 'Session ID required'], 400);
        }

        $session = $this->ownedSession($sessionId);
        
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        // Get all attempts with topic info and mastery changes
        $attempts = DB::table('mastery_challenge_attempts as mca')
            ->join('questions as q', 'mca.question_id', '=', 'q.id')
            ->join('topics as t', 'q.topic_id', '=', 't.id')
            ->leftJoin('mastery_levels as ml_prev', 'mca.previous_mastery_level_id', '=', 'ml_prev.id')
            ->leftJoin('mastery_levels as ml_new', 'mca.new_mastery_level_id', '=', 'ml_new.id')
            ->where('mca.session_id', $sessionId)
            ->select(
                't.name as topic_name',
                'mca.is_correct',
                'ml_prev.name as previous_mastery',
                'ml_new.name as new_mastery',
                'mca.time_taken_seconds'
            )
            ->get();

        // Group by topics showing mastery progression
        $progressByTopic = [];
        foreach ($attempts as $attempt) {
            $topicName = $attempt->topic_name;
            if (!isset($progressByTopic[$topicName])) {
                $progressByTopic[$topicName] = [
                    'topic' => $topicName,
                    'previous_mastery' => $attempt->previous_mastery,
                    'new_mastery' => $attempt->new_mastery,
                    'mastery_changed' => $attempt->previous_mastery !== $attempt->new_mastery
                ];
            } else {
                // Update to latest mastery for this topic
                $progressByTopic[$topicName]['new_mastery'] = $attempt->new_mastery;
                $progressByTopic[$topicName]['mastery_changed'] = 
                    $progressByTopic[$topicName]['previous_mastery'] !== $attempt->new_mastery;
            }
        }

        return response()->json([
            'session_id' => $session->id,
            'total_questions' => $session->total_questions,
            'correct_answers' => $session->correct_answers,
            'total_time_seconds' => $session->total_time_seconds,
            'score_percentage' => $session->total_questions > 0 
                ? round(($session->correct_answers / $session->total_questions) * 100, 1) 
                : 0,
            'status' => $session->status,
            'progress' => array_values($progressByTopic)
        ]);
    }

    /**
 * Get session progress (for reopening modal)
 * GET /mission/challenge/progress?session_id=X
 */
public function getProgress(Request $request)
{
    $sessionId = $request->get('session_id');
    
    if (!$sessionId) {
        return response()->json(['error' => 'Session ID required'], 400);
    }

    $session = $this->ownedSession($sessionId);
    
    if (!$session) {
        return response()->json(['error' => 'Session not found'], 404);
    }

    // Get all answered questions
    $answers = DB::table('mastery_challenge_attempts')
        ->where('session_id', $sessionId)
        ->orderBy('created_at', 'asc')
        ->select('question_id', 'is_correct', 'created_at')
        ->get();

    return response()->json([
        'session_id' => $session->id,
        'total_questions' => $session->total_questions,
        'answered_count' => $answers->count(),
        'answers' => $answers,
        'status' => $session->status
    ]);
}

/** Save the current mission report snapshot when a student leaves early. */
public function saveChallengeProgress(Request $request)
{
    $validated = $request->validate(['session_id' => 'required|integer']);
    $session = $this->ownedSession($validated['session_id']);

    if (! $session) {
        return response()->json(['error' => 'Session not found'], 404);
    }
    $sessionType = $session->session_type ?? 'mission';
    if ($sessionType !== 'mission') {
        return response()->json(['error' => 'Unsupported session type'], 422);
    }

    if (! DB::table('mastery_challenge_attempts')->where('session_id', $session->id)->exists()) {
        return response()->json(['saved' => false, 'answered_count' => 0]);
    }

    if (! $this->saveReportSessionData($session->id)) {
        return response()->json(['error' => 'Could not save session progress'], 500);
    }

    return response()->json(['saved' => true]);
}

/**
 * Start a new subtopic mission
 * POST /mission/subtopic/start
 */
public function startSubtopicMission(Request $request)
{
    $request->validate([
        'subject_id' => 'required|integer',
        'level_id' => 'required|integer',
        'topic_id' => 'required|integer'
    ]);

    $userId = Auth::id();
    
    if (!$userId) {
        return response()->json(['error' => 'Not authenticated'], 401);
    }

    $subjectId = $request->subject_id;
    $levelId = $request->level_id;
    $topicId = $request->topic_id;

    Log::info('=== STARTING PRACTICE SESSION ===');
    Log::info('User ID:', ['user_id' => $userId]);
    Log::info('Request data:', [
        'subject_id' => $subjectId,
        'level_id' => $levelId,
        'topic_id' => $topicId
    ]);

    // Check if topic exists and get its info
    $topic = DB::table('topics')->find($topicId);
    if (!$topic) {
        Log::error('Topic not found:', ['topic_id' => $topicId]);
        return response()->json([
            'error' => 'Topic not found',
            'message' => 'The specified topic does not exist'
        ], 404);
    }
    
    Log::info('Topic found:', [
        'id' => $topic->id,
        'name' => $topic->name,
        'subject_id' => $topic->subject_id,
        'level_id' => $topic->level_id
    ]);

    // Check if the topic belongs to the specified subject and level
    if ($topic->subject_id != $subjectId || $topic->level_id != $levelId) {
        Log::warning('Topic mismatch:', [
            'expected_subject' => $subjectId,
            'actual_subject' => $topic->subject_id,
            'expected_level' => $levelId,
            'actual_level' => $topic->level_id
        ]);
        
        // Still proceed, but log the mismatch
    }

    $topicScope = $this->masteryService->resolveTopicScope((int) $topicId);

    // Refreshing the mission page must not throw away a half-finished mission.
    $activeSession = DB::table('practice_session')
        ->where('user_id', $userId)
        ->where('session_type', 'mission')
        ->where('mission_scope', 'subtopic')
        ->where('status', 'in_progress')
        ->where('topic_id', $topicScope['topic_id'])
        ->where('subtopic_id', $topicScope['subtopic_id'])
        ->where('created_at', '>=', now()->subDay())
        ->orderByDesc('id')
        ->first();

    if ($activeSession && DB::table('mastery_challenge_questions')->where('session_id', $activeSession->id)->count() === (int) $activeSession->total_questions) {
        return response()->json([
            'session_id' => $activeSession->id,
            'total_questions' => $activeSession->total_questions,
            'message' => 'Continuing existing challenge',
            'topic_name' => $topic->name
        ]);
    }

    // Subtopic missions use the same ten-question count as subject missions.
    $questionCount = 10;

    // A parent-topic session includes questions from each of its subtopics.
    $questionIds = $this->generateSubtopicMissionQuestions($topicId, $questionCount);

    // Only active, published and approved questions may be shown; no relaxed fallback.
    if (count($questionIds) < $questionCount) {
        Log::error('Not enough active, published and approved questions for topic:', ['topic_id' => $topicId]);
        return response()->json([
            'error' => 'Not enough questions available',
            'message' => 'A mission requires 10 available questions for this topic.',
            'topic_id' => $topicId,
            'topic_name' => $topic->name
        ], 400);
    }

    Log::info('Questions found:', [
        'count' => count($questionIds),
        'question_ids' => $questionIds
    ]);

    // Create new session
    $sessionId = DB::table('practice_session')->insertGetId([
        'uuid' => (string) Str::uuid(),
        'user_id' => $userId,
        'subject_id' => $subjectId,
        'level_id' => $levelId,
        'topic_id' => $topicScope['topic_id'],
        'subtopic_id' => $topicScope['subtopic_id'],
        'question_type_id' => 1,
        'session_type' => 'mission',
        'mission_scope' => 'subtopic',
        'total_questions' => count($questionIds),
        'total_correct' => 0,
        'total_skipped' => count($questionIds),
        'score' => 0,
        'total_time_seconds' => 0,
        'status' => 'in_progress',
        'start_at' => now(),
        'created_at' => now(),
        'updated_at' => now()
    ]);

    Log::info('Session created:', ['session_id' => $sessionId]);

    // Store the question set
    foreach ($questionIds as $index => $questionId) {
        DB::table('mastery_challenge_questions')->insert([
            'session_id' => $sessionId,
            'question_id' => $questionId,
            'question_order' => $index + 1,
            'created_at' => now()
        ]);
    }

    Log::info('=== PRACTICE SESSION STARTED SUCCESSFULLY ===');

    return response()->json([
        'session_id' => $sessionId,
        'total_questions' => count($questionIds),
        'message' => 'Subtopic mission started successfully',
        'topic_name' => $topic->name
    ]);
}

/**
 * Generate subtopic mission questions
 */
private function generateSubtopicMissionQuestions($topicId, $questionCount = 10)
{
    Log::info('Looking for questions for topic:', ['topic_id' => $topicId]);
    $missionTopicIds = $this->getSubtopicMissionTopicIds($topicId);
    $questionIds = [];

    // Round-robin gives every subtopic a place in a full-topic session.
    while (count($questionIds) < $questionCount) {
        $added = false;

        foreach ($missionTopicIds as $missionTopicId) {
            if (count($questionIds) >= $questionCount) {
                break;
            }

            $questionId = DB::table('questions')
                ->where('topic_id', $missionTopicId)
                ->where('question_type_id', 1)
                ->where('is_active', 1)
                ->where('is_published', 1)
                ->where('approval_status', 1)
                ->whereNotIn('id', $questionIds)
                ->inRandomOrder()
                ->value('id');

            if ($questionId) {
                $questionIds[] = $questionId;
                $added = true;
            }
        }

        if (!$added) {
            break;
        }
    }

    Log::info('Found question IDs:', ['ids' => $questionIds, 'count' => count($questionIds)]);

    return $questionIds;
}

private function getSubtopicMissionTopicIds(int $topicId): array
{
    $topic = DB::table('topics')->find($topicId);
    if (!$topic) {
        return [$topicId];
    }

    $topics = DB::table('topics')
        ->where('subject_id', $topic->subject_id)
        ->where('level_id', $topic->level_id)
        ->where('is_active', 1)
        ->get(['id', 'parent_id']);

    $ids = [$topicId];
    for ($index = 0; $index < count($ids); $index++) {
        foreach ($topics->where('parent_id', $ids[$index]) as $child) {
            if (!in_array((int) $child->id, $ids, true)) {
                $ids[] = (int) $child->id;
            }
        }
    }

    return $ids;
}

/**
 * Get next question for a subtopic mission - reuse the same logic as challenge
 * GET /mission/subtopic/question?session_id=X
 */
public function getSubtopicMissionQuestion(Request $request)
{
    // Reuse the same getQuestion method since tables are the same
    return $this->getQuestion($request);
}

/**
 * Submit answer for a subtopic mission
 * POST /mission/subtopic/answer
 */
public function submitSubtopicMissionAnswer(Request $request)
    {
        $request->validate([
            'session_id' => 'required|integer',
            'question_id' => 'required|integer',
            'answer_id' => 'required|integer',
            'time_taken' => 'required|integer|min:0|max:3600'
        ]);

        $sessionId = $request->session_id;
        $questionId = $request->question_id;
        $answerId = $request->answer_id;
        $timeTaken = $request->time_taken;

        $session = $this->ownedSession($sessionId);
        
        if (!$session || $session->status !== 'in_progress') {
            return response()->json(['error' => 'Invalid session'], 400);
        }

        // Check if already answered
        $existingAttempt = DB::table('mastery_challenge_attempts')
            ->where('session_id', $sessionId)
            ->where('question_id', $questionId)
            ->first();

        if ($existingAttempt) {
            return response()->json(['error' => 'Question already answered'], 400);
        }

        // Get question details
        $question = DB::table('questions')->find($questionId);
        
        if (!$question) {
            return response()->json(['error' => 'Question not found'], 404);
        }

        if ((int) $question->question_type_id !== 1) {
            return response()->json(['error' => 'Mastery sessions only accept objective questions'], 422);
        }

        $inSession = DB::table('mastery_challenge_questions')
            ->where('session_id', $sessionId)
            ->where('question_id', $questionId)
            ->exists();

        if (!$inSession) {
            return response()->json(['error' => 'That question is not part of this session'], 422);
        }

        // Check if answer is correct (the answer must belong to this question)
        $answer = DB::table('answers')->where('id', $answerId)->where('question_id', $questionId)->first();
        $isCorrect = $answer && $answer->iscorrectanswer == 1;

        Log::info('Submitting subtopic mission answer', [
            'session_id' => $sessionId,
            'question_id' => $questionId,
            'answer_id' => $answerId,
            'is_correct' => $isCorrect
        ]);

        $topicScope = $this->masteryService->resolveTopicScope($question->topic_id);

        // Keep mastery on the exact learning scope: topic or child subtopic.
        $masteryUpdate = $this->masteryService->updateTopicMastery(
            $session->user_id,
            $question->topic_id,
            $session->subject_id,
            $session->level_id,
            $isCorrect,
            $timeTaken
        );

        // Record the attempt in existing mastery_challenge_attempts table
        DB::table('mastery_challenge_attempts')->insert([
            'session_id' => $sessionId,
            'user_id' => $session->user_id,
            'question_id' => $questionId,
            'topic_id' => $question->topic_id,
            'subtopic_id' => $topicScope['subtopic_id'],
            'choosen_answer_id' => $answerId,
            'is_correct' => $isCorrect ? 1 : 0,
            'time_taken_seconds' => $timeTaken,
            'previous_mastery_level_id' => $masteryUpdate['previous_level'],
            'new_mastery_level_id' => $masteryUpdate['new_level'],
            'created_at' => now()
        ]);

        app(StreakService::class)->recordAnswer($session->user_id);

        // Update session stats
        if ($isCorrect) {
            DB::table('practice_session')
                ->where('id', $sessionId)
                ->increment('total_correct');
        }
        
        DB::table('practice_session')
            ->where('id', $sessionId)
            ->increment('total_time_seconds', $timeTaken);

        // Check if mission is complete
        $answeredCount = DB::table('mastery_challenge_attempts')
            ->where('session_id', $sessionId)
            ->count();

        $missionComplete = $answeredCount >= $session->total_questions;

        if ($missionComplete) {
            DB::table('practice_session')
                ->where('id', $sessionId)
                ->update([
                    'status' => 'completed',
                    'end_at' => now(),
                    'updated_at' => now()
                ]);

            // Update progress cache
            $this->masteryService->updateProgressCache(
                $session->user_id,
                $session->subject_id,
                $session->level_id
            );

            Log::info('Subtopic mission completed', ['session_id' => $sessionId]);
        }

        // Record partial mission answers immediately, including early exits.
        $this->saveReportSessionData($sessionId);

        return response()->json([
            'is_correct' => $isCorrect,
            'mastery_changed' => $masteryUpdate['previous_level'] !== $masteryUpdate['new_level'],
            'previous_mastery' => $masteryUpdate['previous_level'],
            'new_mastery' => $masteryUpdate['new_level'],
            'mission_complete' => $missionComplete
        ]);
    }

private function saveReportSessionData(int $sessionId): bool
{
    try {
        DB::transaction(function () use ($sessionId): void {
            $current = DB::table('practice_session')->where('id', $sessionId)->lockForUpdate()->first();
            $attempts = DB::table('mastery_challenge_attempts')
                ->where('session_id', $sessionId)->orderBy('id')->get();
            if (! $current || $attempts->isEmpty()) {
                return;
            }

            $firstTopicId = (int) $attempts->first()->topic_id;
            $scope = $this->masteryService->resolveTopicScope($firstTopicId);
            $correct = $attempts->where('is_correct', 1)->count();
            $total = (int) $current->total_questions;
            DB::table('practice_session')->where('id', $sessionId)->update([
                'topic_id' => $scope['topic_id'],
                'subtopic_id' => $scope['subtopic_id'],
                'total_correct' => $correct,
                'total_skipped' => max(0, $total - $attempts->count()),
                'score' => $total > 0 ? round($correct * 100 / $total) : 0,
                'updated_at' => now(),
            ]);

            DB::table('quiz_attempts')->where('session_id', $sessionId)->delete();
            $questionParents = DB::table('questions')
                ->whereIn('id', $attempts->pluck('question_id'))
                ->pluck('parent_id', 'id');
            DB::table('quiz_attempts')->insert($attempts->map(fn ($attempt) => [
                'user_id' => $current->user_id,
                'parent_id' => $questionParents[$attempt->question_id] ?? 0,
                'question_id' => $attempt->question_id,
                'topic_id' => $scope['topic_id'],
                'subtopic_id' => $scope['subtopic_id'],
                'choosen_answer_id' => $attempt->choosen_answer_id,
                'answer_status' => $attempt->is_correct,
                'subjective_answer' => null,
                'session_id' => $sessionId,
                'time_taken' => $attempt->time_taken_seconds,
                'question_type_id' => 1,
                'created_at' => $attempt->created_at ?? now(),
                'updated_at' => $attempt->created_at ?? now(),
            ])->all());
        });

        return true;
    } catch (\Exception $e) {
        Log::error('Failed to save mission progress', [
            'session_id' => $sessionId,
            'error' => $e->getMessage(),
        ]);

        return false;
    }
}
/**
 * Get subtopic mission summary
 * GET /mission/subtopic/summary?session_id=X
 */
public function getSubtopicMissionSummary(Request $request)
{
    try {
        $sessionId = $request->get('session_id');
        
        if (!$sessionId) {
            return response()->json(['error' => 'Session ID required'], 400);
        }

        // Get the session with basic info
        $session = $this->ownedSession($sessionId);
        
        if (!$session) {
            return response()->json(['error' => 'Session not found'], 404);
        }

        // Get topic name from the first question in the session
        $topicInfo = DB::table('mastery_challenge_questions as mcq')
            ->join('questions as q', 'mcq.question_id', '=', 'q.id')
            ->leftJoin('topics as t', 'q.topic_id', '=', 't.id')
            ->where('mcq.session_id', $sessionId)
            ->orderBy('mcq.question_order', 'asc')
            ->select('t.name as topic_name')
            ->first();

        // Calculate score percentage
        $scorePercentage = $session->total_questions > 0 
            ? round(($session->correct_answers / $session->total_questions) * 100, 1) 
            : 0;

        // Return only session data (no mastery progress)
        return response()->json([
            'session_id' => $session->id,
            'topic_name' => $topicInfo->topic_name ?? 'Mission Topic',
            'total_questions' => $session->total_questions,
            'correct_answers' => $session->correct_answers,
            'incorrect_answers' => $session->total_questions - $session->correct_answers,
            'total_time_seconds' => $session->total_time_seconds,
            'score_percentage' => $scorePercentage,
            'score' => $session->correct_answers, // Raw score
            'status' => $session->status,
            'started_at' => $session->started_at,
            'completed_at' => $session->completed_at ?? now()->format('Y-m-d H:i:s')
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error in getSubtopicMissionSummary:', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'error' => 'Internal server error',
            'message' => $e->getMessage()
        ], 500);
    }
}

}
