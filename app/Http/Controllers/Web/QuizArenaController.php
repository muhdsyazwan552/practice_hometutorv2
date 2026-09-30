<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\QuizArenaAttempt;
use App\Models\QuizArenaReward;
use App\Models\QuizArenaSession;
use App\Services\QuizArenaService;
use App\Services\QuizArenaWalletService;
use App\Support\QuestionContentNormalizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Throwable;

class QuizArenaController extends Controller
{
    public function show(Request $request, QuizArenaService $arena, QuizArenaWalletService $wallet): InertiaResponse
    {
        $user = $request->user();
        $levelId = $user->student?->level_id;
        $weekendDate = $arena->currentWeekendDate();

        $session = $levelId ? QuizArenaSession::query()
            ->where('user_id', $user->id)
            ->where('weekend_date', $weekendDate->toDateString())
            ->first() : null;

        // Only students at the same level compete together. The rank is
        // computed live from completed attempts: most correct answers first,
        // then the lowest actual answer time.
        $leaderboard = $levelId
            ? $this->leaderboardFor($user->id, (int) $levelId, $weekendDate->toDateString())
            : collect();
        $liveRank = $session?->status === QuizArenaSession::STATUS_COMPLETED
            ? data_get($leaderboard->firstWhere('is_me', true), 'rank')
            : null;

        return Inertia::render('games/QuizArena', [
            'hasLevel' => (bool) $levelId,
            'pointBalance' => $wallet->balance($user->id),
            'isOpen' => $arena->isOpen(),
            'opensAt' => $arena->opensAt()->toIso8601String(),
            'closesAt' => $arena->closesAt()->toIso8601String(),
            'session' => $session ? [
                'uuid' => $session->uuid,
                'status' => $session->status,
                'total_questions' => $session->total_questions,
                'correct_answers' => $session->correct_answers,
                'total_time_seconds' => $session->total_time_seconds,
                'rank' => $liveRank,
                'points_awarded' => $session->points_awarded,
            ] : null,
            'leaderboard' => $leaderboard,
        ]);
    }

    public function start(Request $request, QuizArenaService $arena): JsonResponse
    {
        $user = $request->user();
        abort_unless($arena->isOpen(), 403, 'Quiz Arena is only open on Saturday and Sunday.');

        $levelId = $user->student?->level_id;
        abort_unless($levelId, 422, 'No level is set on this account yet.');

        $weekendDate = $arena->currentWeekendDate();

        $existing = QuizArenaSession::query()
            ->where('user_id', $user->id)
            ->where('weekend_date', $weekendDate->toDateString())
            ->first();

        if ($existing) {
            if ($existing->status === QuizArenaSession::STATUS_COMPLETED) {
                return response()->json(['error' => 'You already played Quiz Arena this weekend.'], 400);
            }

            return response()->json([
                'session_uuid' => $existing->uuid,
                'total_questions' => $existing->total_questions,
                'already_started' => true,
            ]);
        }

        $questionIds = $arena->generateQuestions((int) $levelId, 10);
        if (empty($questionIds)) {
            return response()->json(['error' => 'No questions are available for your level yet.'], 400);
        }

        try {
            $session = QuizArenaSession::create([
                'user_id' => $user->id,
                'level_id' => $levelId,
                'weekend_date' => $weekendDate->toDateString(),
                'question_ids' => $questionIds,
                'status' => QuizArenaSession::STATUS_IN_PROGRESS,
                'total_questions' => count($questionIds),
                'started_at' => now(),
            ]);
        } catch (Throwable $exception) {
            // Unique (user_id, weekend_date) race — someone else's request won it first.
            $session = QuizArenaSession::query()
                ->where('user_id', $user->id)
                ->where('weekend_date', $weekendDate->toDateString())
                ->firstOrFail();
        }

        return response()->json([
            'session_uuid' => $session->uuid,
            'total_questions' => $session->total_questions,
        ]);
    }

    public function getQuestion(Request $request, QuizArenaService $arena): JsonResponse
    {
        abort_unless($arena->isOpen(), 403, 'Quiz Arena is closed. Your answer time only counts while a question is active.');
        $session = $this->ownedSession($request, $request->query('session_uuid'));

        if ($session->status !== QuizArenaSession::STATUS_IN_PROGRESS) {
            return response()->json(['completed' => true]);
        }

        $answeredIds = $session->attempts()->pluck('question_id')->all();
        $remainingIds = array_values(array_diff($session->question_ids, $answeredIds));

        if (empty($remainingIds)) {
            return response()->json(['completed' => true]);
        }

        $question = DB::table('questions')->find($remainingIds[0]);
        if (! $question) {
            return response()->json(['completed' => true]);
        }

        $answers = DB::table('answers')
            ->where('question_id', $question->id)
            ->where('isactive', 1)
            ->select('id', 'answer_text', 'answer_option_file', 'iscorrectanswer as is_correct_answer', 'reason', 'reason2', 'reason_file')
            ->inRandomOrder()
            ->get()
            ->map(fn ($answer) => QuestionContentNormalizer::answerRow($answer));

        $questionData = ['id' => $question->id, 'topic_id' => $question->topic_id];

        $questionHtml = QuestionContentNormalizer::questionHtml($question->question_text, $question->question_file);
        if ($questionHtml) {
            $questionData['question_text'] = $questionHtml;
        }

        $questionFileUrl = QuestionContentNormalizer::questionFileUrl($question->question_file);
        if ($questionFileUrl) {
            $questionData['question_file'] = $questionFileUrl;
        }

        return response()->json([
            'completed' => false,
            'current_question' => count($answeredIds) + 1,
            'total_questions' => $session->total_questions,
            'question' => $questionData,
            'answers' => $answers,
        ]);
    }

    public function submitAnswer(Request $request, QuizArenaService $arena): JsonResponse
    {
        $validated = $request->validate([
            'session_uuid' => ['required', 'string'],
            'question_id' => ['required', 'integer'],
            'answer_id' => ['required', 'integer'],
            'time_taken' => ['required', 'integer', 'min:0'],
        ]);

        abort_unless($arena->isOpen(), 403, 'Quiz Arena is closed. Your answer was not recorded.');

        $session = $this->ownedSession($request, $validated['session_uuid']);
        abort_unless($session->status === QuizArenaSession::STATUS_IN_PROGRESS, 400, 'This session is not active.');
        abort_unless(in_array($validated['question_id'], $session->question_ids, false), 422, 'That question is not part of this session.');

        if ($session->attempts()->where('question_id', $validated['question_id'])->exists()) {
            return response()->json(['error' => 'Question already answered'], 400);
        }

        $question = DB::table('questions')->find($validated['question_id']);
        abort_unless($question, 404, 'Question not found.');

        $answer = DB::table('answers')
            ->where('id', $validated['answer_id'])
            ->where('question_id', $question->id)
            ->first();
        $isCorrect = (bool) ($answer && $answer->iscorrectanswer);
        $topic = DB::table('topics')->find($question->topic_id);

        QuizArenaAttempt::create([
            'session_id' => $session->id,
            'user_id' => $session->user_id,
            'question_id' => $question->id,
            'subject_id' => $topic->subject_id ?? null,
            'topic_id' => $question->topic_id,
            'chosen_answer_id' => $validated['answer_id'],
            'is_correct' => $isCorrect,
            'time_taken_seconds' => $validated['time_taken'],
            'created_at' => now(),
        ]);

        if ($isCorrect) {
            $session->increment('correct_answers');
        }
        $session->increment('total_time_seconds', $validated['time_taken']);

        $answeredCount = $session->attempts()->count();
        $completed = $answeredCount >= $session->total_questions;

        if ($completed) {
            $session->update(['status' => QuizArenaSession::STATUS_COMPLETED, 'completed_at' => now()]);
        }

        return response()->json(['is_correct' => $isCorrect, 'completed' => $completed]);
    }

    public function getSummary(Request $request): JsonResponse
    {
        $session = $this->ownedSession($request, $request->query('session_uuid'));
        $leaderboard = $session->status === QuizArenaSession::STATUS_COMPLETED
            ? $this->leaderboardFor($request->user()->id, (int) $session->level_id, $session->weekend_date->toDateString())
            : collect();
        $liveRank = data_get($leaderboard->firstWhere('is_me', true), 'rank');

        return response()->json([
            'total_questions' => $session->total_questions,
            'correct_answers' => $session->correct_answers,
            'total_time_seconds' => $session->total_time_seconds,
            'status' => $session->status,
            'rank' => $liveRank,
            'points_awarded' => $session->points_awarded,
            'leaderboard' => $leaderboard,
        ]);
    }

    public function wallet(Request $request, QuizArenaWalletService $wallet): JsonResponse
    {
        $userId = $request->user()->id;

        return response()->json([
            'balance' => $wallet->balance($userId),
            'rewards' => $wallet->rewardsCatalog($userId),
            'log' => $wallet->log($userId)->map(fn ($entry) => [
                'points' => $entry->points,
                'description' => $entry->description,
                'created_at' => $entry->created_at?->toIso8601String(),
            ]),
        ]);
    }

    public function shop(Request $request, QuizArenaWalletService $wallet): InertiaResponse
    {
        return Inertia::render('games/QuizArenaRewards', [
            'section' => 'shop',
            ...$this->walletPageData($request, $wallet),
        ]);
    }

    public function rewards(Request $request, QuizArenaWalletService $wallet): InertiaResponse
    {
        return Inertia::render('games/QuizArenaRewards', [
            'section' => 'rewards',
            ...$this->walletPageData($request, $wallet),
        ]);
    }

    public function claimReward(Request $request, QuizArenaReward $reward, QuizArenaWalletService $wallet): JsonResponse
    {
        try {
            $wallet->claimReward($request->user(), $reward);
        } catch (ValidationException $exception) {
            return response()->json(['error' => $exception->validator->errors()->first()], 422);
        }

        return response()->json([
            'balance' => $wallet->balance($request->user()->id),
            'rewards' => $wallet->rewardsCatalog($request->user()->id),
            'log' => $wallet->log($request->user()->id)->map(fn ($entry) => [
                'points' => $entry->points,
                'description' => $entry->description,
                'created_at' => $entry->created_at?->toIso8601String(),
            ]),
        ]);
    }

    private function walletPageData(Request $request, QuizArenaWalletService $wallet): array
    {
        $userId = $request->user()->id;

        return [
            'pointBalance' => $wallet->balance($userId),
            'rewards' => $wallet->rewardsCatalog($userId),
            'pointLog' => $wallet->log($userId)->map(fn ($entry) => [
                'points' => $entry->points,
                'description' => $entry->description,
                'created_at' => $entry->created_at?->toIso8601String(),
            ])->values(),
        ];
    }

    private function leaderboardFor(int $currentUserId, int $levelId, string $weekendDate)
    {
        return QuizArenaSession::query()
            ->where('level_id', $levelId)
            ->where('weekend_date', $weekendDate)
            ->where('status', QuizArenaSession::STATUS_COMPLETED)
            ->with('user:id,name,display_name')
            ->orderByDesc('correct_answers')
            ->orderBy('total_time_seconds')
            ->get()
            ->values()
            ->map(fn (QuizArenaSession $row, int $index) => [
                'rank' => $index + 1,
                'name' => $row->user?->display_name ?: $row->user?->name ?: 'Player',
                'correct_answers' => $row->correct_answers,
                'total_questions' => $row->total_questions,
                'total_time_seconds' => $row->total_time_seconds,
                'points_awarded' => $row->points_awarded,
                'is_me' => $row->user_id === $currentUserId,
            ]);
    }

    private function ownedSession(Request $request, ?string $uuid): QuizArenaSession
    {
        abort_if(blank($uuid), 422, 'A session_uuid is required.');

        return QuizArenaSession::query()
            ->where('uuid', $uuid)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
    }
}
