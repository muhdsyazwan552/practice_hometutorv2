<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\StreakService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;

class LearningDashboardController extends Controller
{
    /** Days covered by the two dashboard charts. */
    private const CHART_DAYS = 30;

    /** Months shown in the login calendar, including the current one. */
    private const CALENDAR_MONTHS = 3;

    /** Rows in the login history panel beside the calendar. */
    private const LOGIN_HISTORY_LIMIT = 40;

    public function show(Request $request, string $childUuid): Response
    {
        // Scope the lookup to this parent. A valid UUID owned by another parent
        // deliberately produces the same 404 response as an unknown UUID.
        $student = $request->user()
            ->children()
            ->with(['user', 'school', 'level'])
            ->where('uuid', $childUuid)
            ->firstOrFail();

        $child = $student->user;
        abort_unless($child && $child->isChild() && $child->is_active, 404);

        $locale = Session::get('locale', $request->user()->language ?: 'en');
        App::setLocale($locale);

        $childId = (int) $child->id;
        $sessions = $this->sessions($childId, self::CHART_DAYS);

        return Inertia::render('Parent/Dashboard', [
            'title' => $child->display_name ?: $child->name,
            'viewerMode' => 'parent',
            'viewedChild' => [
                'uuid' => $student->uuid,
                'name' => $student->full_name ?: $child->display_name ?: $child->name,
                'username' => $child->username,
            ],
            'reportChildren' => $this->reportChildren($request, $student),
            'returnToParentUrl' => route('parent.dashboard'),
            'parentDashboardUrl' => route('parent.children.learning-dashboard', $student->uuid),
            'parentReportUrl' => route('parent.children.reports', $student->uuid),
            'sessionHistoryUrl' => route('parent.children.reports.history', $student->uuid),
            'activeTab' => 'dashboard',
            'profileData' => [
                'name' => $student->full_name ?: $child->name,
                'email' => $child->email,
                'school' => $student->school?->name ?? 'School not specified',
                'grade' => $student->class_name ?? $student->level?->name ?? 'Level not specified',
                'display_name' => $child->display_name ?: $child->name,
                'profile_picture' => $child->profile_picture ?? null,
            ],
            'student' => $student,
            'streaks' => app(StreakService::class)->summary($childId),
            'loginSummary' => $this->loginSummary($childId),
            'answerTotals' => $this->answerTotals($childId),
            'todayQuestions' => $this->todayQuestions($childId),
            'chartDays' => self::CHART_DAYS,
            'questionsPerDay' => $this->questionsPerDay($sessions, self::CHART_DAYS),
            'subjectPerformance' => $this->subjectPerformance($sessions),
            'loginCalendar' => $this->loginCalendar($childId),
            'loginHistory' => $this->loginHistory($childId),
            'locale' => $locale,
            'translations' => trans('common', [], $locale),
            'availableLocales' => ['en', 'ms'],
        ]);
    }

    /**
     * Completed sessions in the chart window, already reduced to the few fields
     * both charts need. A question counts as answered once it is not skipped.
     */
    private function sessions(int $childId, int $days): Collection
    {
        if (! Schema::hasTable('practice_session')) {
            return collect();
        }

        return DB::table('practice_session as ps')
            ->leftJoin('subject as s', 's.id', '=', 'ps.subject_id')
            ->where('ps.user_id', $childId)
            ->where('ps.created_at', '>=', CarbonImmutable::now()->subDays($days - 1)->startOfDay())
            ->get([
                'ps.created_at', 'ps.score', 'ps.total_questions', 'ps.total_correct', 'ps.total_skipped',
                's.name as subject_name',
            ])
            ->map(fn (object $row) => [
                'date' => CarbonImmutable::parse($row->created_at)->toDateString(),
                'subject' => $row->subject_name ?: 'Other',
                'score' => (float) ($row->score ?? 0),
                'answered' => $this->answeredCount($row),
            ]);
    }

    private function answeredCount(object $row): int
    {
        return max((int) ($row->total_questions ?? 0) - (int) ($row->total_skipped ?? 0), 0);
    }

    /**
     * How often the child signed in during the current calendar month.
     */
    private function loginSummary(int $childId): array
    {
        $month = CarbonImmutable::now()->startOfMonth();

        if (! Schema::hasTable('login_activity_logs')) {
            return ['month_label' => $month->format('F Y'), 'total_logins' => 0, 'active_days' => 0, 'last_login' => null];
        }

        $logins = DB::table('login_activity_logs')
            ->where('user_id', $childId)
            ->whereBetween('logged_in_at', [$month, $month->endOfMonth()])
            ->pluck('logged_in_at');

        $last = DB::table('login_activity_logs')
            ->where('user_id', $childId)
            ->max('logged_in_at');

        return [
            'month_label' => $month->format('F Y'),
            'total_logins' => $logins->count(),
            'active_days' => $logins->map(fn ($at) => CarbonImmutable::parse($at)->toDateString())->unique()->count(),
            'last_login' => $last ? CarbonImmutable::parse($last)->format('d M Y, g:ia') : null,
        ];
    }

    /**
     * Questions answered today, this week and this month. Each window is a
     * calendar period rather than a rolling one, so "monthly" matches the
     * login total beside it.
     */
    private function answerTotals(int $childId): array
    {
        $now = CarbonImmutable::now();

        return [
            'daily' => $this->answeredBetween($childId, $now->startOfDay(), $now->endOfDay()),
            'weekly' => $this->answeredBetween($childId, $now->startOfWeek(), $now->endOfWeek()),
            'monthly' => $this->answeredBetween($childId, $now->startOfMonth(), $now->endOfMonth()),
        ];
    }

    private function answeredBetween(int $childId, CarbonImmutable $from, CarbonImmutable $to): int
    {
        if (! Schema::hasTable('practice_session')) {
            return 0;
        }

        $totals = DB::table('practice_session')
            ->where('user_id', $childId)
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('COALESCE(SUM(total_questions), 0) as questions, COALESCE(SUM(total_skipped), 0) as skipped')
            ->first();

        return max((int) $totals->questions - (int) $totals->skipped, 0);
    }

    /**
     * Today's answered total, split by subject.
     */
    private function todayQuestions(int $childId): array
    {
        if (! Schema::hasTable('practice_session')) {
            return ['total' => 0, 'subjects' => []];
        }

        $today = CarbonImmutable::now();

        $subjects = DB::table('practice_session as ps')
            ->leftJoin('subject as s', 's.id', '=', 'ps.subject_id')
            ->where('ps.user_id', $childId)
            ->whereBetween('ps.created_at', [$today->startOfDay(), $today->endOfDay()])
            ->groupBy('s.name')
            ->selectRaw("COALESCE(s.name, 'Other') as name, COALESCE(SUM(ps.total_questions), 0) as questions, COALESCE(SUM(ps.total_skipped), 0) as skipped")
            ->get()
            ->map(fn (object $row) => [
                'name' => $row->name,
                'questions' => max((int) $row->questions - (int) $row->skipped, 0),
            ])
            ->filter(fn (array $row) => $row['questions'] > 0)
            ->sortByDesc('questions')
            ->values();

        return [
            'total' => (int) $subjects->sum('questions'),
            'subjects' => $subjects->all(),
        ];
    }

    /**
     * One entry per day across the whole window, including days with no
     * activity — a gap in the bars is itself information for a parent.
     */
    private function questionsPerDay(Collection $sessions, int $days): array
    {
        $answeredByDate = $sessions->groupBy('date')->map(fn (Collection $rows) => (int) $rows->sum('answered'));
        $start = CarbonImmutable::now()->subDays($days - 1)->startOfDay();

        return collect(range(0, $days - 1))
            ->map(function (int $offset) use ($start, $answeredByDate) {
                $date = $start->addDays($offset);

                return [
                    'date' => $date->toDateString(),
                    'label' => $date->format('j M'),
                    'weekday' => $date->format('D'),
                    'questions' => $answeredByDate->get($date->toDateString(), 0),
                ];
            })
            ->all();
    }

    /**
     * Average score per subject, weakest first, so the chart answers "where
     * does this child need help" without the parent reading every row.
     */
    private function subjectPerformance(Collection $sessions): array
    {
        return $sessions
            ->groupBy('subject')
            ->map(fn (Collection $rows, string $subject) => [
                'name' => $subject,
                'score' => round($rows->avg('score'), 1),
                'sessions' => $rows->count(),
                'questions' => (int) $rows->sum('answered'),
            ])
            ->sortBy('score')
            ->values()
            ->all();
    }

    /**
     * The current month and the two before it, each as a calendar grid with a
     * login count per day. Weeks start on Monday.
     */
    private function loginCalendar(int $childId): array
    {
        $firstMonth = CarbonImmutable::now()->startOfMonth()->subMonths(self::CALENDAR_MONTHS - 1);

        $countsByDate = Schema::hasTable('login_activity_logs')
            ? DB::table('login_activity_logs')
                ->where('user_id', $childId)
                ->where('logged_in_at', '>=', $firstMonth)
                ->pluck('logged_in_at')
                ->countBy(fn ($at) => CarbonImmutable::parse($at)->toDateString())
            : collect();

        $today = CarbonImmutable::now()->toDateString();

        return collect(range(0, self::CALENDAR_MONTHS - 1))
            ->map(function (int $offset) use ($firstMonth, $countsByDate, $today) {
                $month = $firstMonth->addMonths($offset);

                $days = collect(range(1, $month->daysInMonth))->map(function (int $day) use ($month, $countsByDate, $today) {
                    $date = $month->addDays($day - 1)->toDateString();

                    return [
                        'day' => $day,
                        'date' => $date,
                        'logins' => (int) $countsByDate->get($date, 0),
                        'is_today' => $date === $today,
                    ];
                })->all();

                return [
                    'key' => $month->format('Y-m'),
                    'label' => $month->format('F Y'),
                    'short_label' => $month->format('M'),
                    // Monday-first offset for the leading blank cells.
                    'lead_blanks' => ($month->dayOfWeek + 6) % 7,
                    'total_logins' => collect($days)->sum('logins'),
                    'days' => $days,
                ];
            })
            ->all();
    }

    /**
     * Recent sign-ins with the time of day, grouped by date on the front end.
     */
    private function loginHistory(int $childId): array
    {
        if (! Schema::hasTable('login_activity_logs')) {
            return [];
        }

        return DB::table('login_activity_logs')
            ->where('user_id', $childId)
            ->orderByDesc('logged_in_at')
            ->limit(self::LOGIN_HISTORY_LIMIT)
            ->get(['logged_in_at', 'device_type'])
            ->map(function (object $row) {
                $at = CarbonImmutable::parse($row->logged_in_at);

                return [
                    'date' => $at->toDateString(),
                    'date_label' => $at->format('D, j M Y'),
                    'time' => $at->format('g:i a'),
                    'device' => $row->device_type ?: 'desktop',
                ];
            })
            ->all();
    }

    private function reportChildren(Request $request, Student $selectedStudent): array
    {
        return $request->user()->children()->with('user')->orderBy('full_name')->get()
            ->map(fn (Student $child) => [
                'uuid' => $child->uuid,
                'name' => $child->full_name ?: $child->user->display_name ?: $child->user->name,
                'selected' => $child->id === $selectedStudent->id,
                'report_url' => route('parent.children.reports', $child->uuid),
                'history_url' => route('parent.children.reports.history', $child->uuid),
                'dashboard_url' => route('parent.children.learning-dashboard', $child->uuid),
            ])->values()->all();
    }
}
