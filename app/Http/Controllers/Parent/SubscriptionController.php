<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\ActivationCode;
use App\Models\Package;
use App\Services\ActivationCodeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SubscriptionController extends Controller
{
    public function index(Request $request): View
    {
        return view('parent.subscriptions.index', [
            'packages' => Package::query()->with(['levels', 'durationOptions' => fn ($query) => $query->where('is_active', true)->whereIn('months', [6, 12])->orderBy('months')])->where('is_active', true)->whereNotNull('curriculum_group')->orderBy('id')->get(),
            'codes' => $request->user()->activationCodes()->with(['package', 'payment', 'redeemedByChild', 'renewalChild.student'])->latest()->get(),
        ]);
    }

    public function resend(Request $request, string $codeUuid, ActivationCodeService $service): RedirectResponse
    {
        $code = $request->user()->activationCodes()->where('uuid', $codeUuid)
            ->where('status', ActivationCode::STATUS_UNUSED)->firstOrFail();

        if (! $code->code_value) {
            return back()->with('error', 'This code cannot be read on this server, so it cannot be emailed again. Please contact support with the code ending '.$code->code_last_four.'.');
        }

        $service->resend($code, $request->user());

        return back()->with('success', 'The activation-code email was sent again.');
    }
}
