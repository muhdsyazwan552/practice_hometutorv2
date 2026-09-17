<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class QuestionReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question_id' => ['required', 'integer', Rule::exists('questions', 'id')],
            'context' => ['required', Rule::in([
                'objective_practice',
                'subjective_practice',
                'mission_practice',
                'mastery_challenge',
                'question_review',
            ])],
            'reason' => ['required', Rule::in([
                'incorrect_answer',
                'unclear_question',
                'broken_image',
                'incorrect_content',
                'technical_issue',
                'other',
            ])],
            'details' => ['nullable', 'string', 'max:2000', 'required_if:reason,other'],
            'page_url' => ['nullable', 'string', 'max:2000'],
        ]);

        $userId = (int) $request->user()->id;
        $existingReport = DB::table('question_reports')
            ->where('user_id', $userId)
            ->where('question_id', $validated['question_id'])
            ->where('context', $validated['context'])
            ->where('status', 'open')
            ->where('created_at', '>=', now()->subDay())
            ->first();

        if ($existingReport) {
            return response()->json([
                'message' => 'You already reported this question. Thank you.',
                'report_id' => $existingReport->id,
                'duplicate' => true,
            ]);
        }

        $question = DB::table('questions')->select('id', 'question_code', 'topic_id')->find($validated['question_id']);
        $topic = $question?->topic_id
            ? DB::table('topics')->select('id', 'parent_id', 'subject_id')->find($question->topic_id)
            : null;
        $isSubtopic = $topic && (int) $topic->parent_id > 0;

        $reportId = DB::table('question_reports')->insertGetId([
            'user_id' => $userId,
            'question_id' => $validated['question_id'],
            'question_code' => $question?->question_code,
            'subject_id' => $topic?->subject_id,
            'topic_id' => $isSubtopic ? $topic->parent_id : $topic?->id,
            'context' => $validated['context'],
            'report_type' => $validated['reason'],
            'details' => $validated['details'] ?? null,
            'page_url' => $validated['page_url'] ?? null,
            'status' => 'open',
            'metadata' => json_encode([
                'subtopic_id' => $isSubtopic ? $topic->id : null,
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Question report submitted. Thank you for helping us improve.',
            'report_id' => $reportId,
        ], 201);
    }
}
