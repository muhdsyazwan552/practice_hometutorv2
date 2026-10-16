@extends('layouts.parent')
@section('title', 'Payment and Activation Log')
@section('content')
<div>
    <p class="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 sm:text-sm">Account history</p>
    <h1 class="mt-2 text-2xl font-extrabold text-[#082c58] sm:text-3xl">Payment and activation log</h1>
    <p class="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">Review payment references, purchased durations, activation-code status, and child assignments.</p>
</div>

<section class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-7">
    <div class="border-b border-slate-200 p-4 sm:p-6"><h2 class="text-base font-extrabold text-[#082c58] sm:text-lg">Payment history</h2><p class="mt-1 text-sm text-slate-500">DOKU payment attempts made using your parent account are shown, including pending and unsuccessful attempts.</p></div>

    {{-- Phone and small-tablet view: one stacked card per payment, so nothing needs sideways scrolling. --}}
    <div class="divide-y divide-slate-100 lg:hidden">
        @forelse($payments as $payment)
            <article class="p-4 sm:p-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p class="font-bold text-[#082c58]">{{ $payment->order?->items->pluck('package_name_snapshot')->filter()->unique()->join(', ') ?: 'Package unavailable' }}</p>
                        <p class="mt-1 text-xs capitalize text-slate-500">{{ str_replace('_', ' ', $payment->payment_channel ?? $payment->provider) }}</p>
                    </div>
                    <p class="shrink-0 text-lg font-extrabold text-sky-700">{{ $payment->currency }} {{ number_format($payment->amount, 2) }}</p>
                </div>
                <dl class="mt-4 grid gap-3 min-[420px]:grid-cols-2">
                    <div><dt class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Date</dt><dd class="mt-0.5 text-sm font-semibold text-slate-800">{{ ($payment->paid_at ?? $payment->created_at)->format('d M Y, H:i') }}</dd></div>
                    <div><dt class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Duration</dt><dd class="mt-0.5 text-sm font-semibold text-slate-800">{{ $payment->order?->items->map(fn ($item) => $item->durationOption ? $item->durationOption->months.' months ('.$item->duration_days.' days)' : $item->duration_days.' days')->unique()->join(', ') ?: '—' }}</dd></div>
                    <div class="min-w-0"><dt class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Reference</dt><dd class="mt-0.5 break-all font-mono text-xs text-slate-600">{{ $payment->provider_order_reference ?? $payment->provider_transaction_reference ?? $payment->uuid }}</dd></div>
                    <div><dt class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</dt><dd class="mt-1"><span class="rounded-full px-2.5 py-1 text-xs font-bold capitalize {{ $payment->status === 'paid' ? 'bg-emerald-50 text-emerald-700' : ($payment->status === 'pending' ? 'bg-amber-50 text-amber-700' : ($payment->status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')) }}">{{ $payment->status }}</span></dd></div>
                    <div><dt class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Result</dt><dd class="mt-0.5 text-sm text-slate-700">{{ $payment->status === 'paid' ? 'Subscription activated' : ($payment->status === 'pending' ? 'Awaiting confirmation' : ($payment->status === 'cancelled' ? 'Cancelled or expired' : 'Payment not completed')) }}</dd></div>
                </dl>
            </article>
        @empty
            <p class="p-6 text-center text-sm text-slate-500">No payment records yet.</p>
        @endforelse
    </div>

    <div class="hidden overflow-x-auto lg:block">
        <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th class="px-5 py-3">Date / reference</th><th class="px-5 py-3">Package</th><th class="px-5 py-3">Duration</th><th class="px-5 py-3">Total</th><th class="px-5 py-3">Status</th><th class="px-5 py-3">Result</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
            @forelse($payments as $payment)
                <tr class="align-top">
                    <td class="whitespace-nowrap px-5 py-4"><span class="font-semibold text-slate-800">{{ ($payment->paid_at ?? $payment->created_at)->format('d M Y, H:i') }}</span><span class="mt-1 block font-mono text-xs text-slate-500">{{ $payment->provider_order_reference ?? $payment->provider_transaction_reference ?? $payment->uuid }}</span><span class="mt-1 block text-xs text-slate-400">{{ $payment->order?->order_number }}</span></td>
                    <td class="px-5 py-4"><span class="font-bold text-[#082c58]">{{ $payment->order?->items->pluck('package_name_snapshot')->filter()->unique()->join(', ') ?: 'Package unavailable' }}</span><span class="mt-1 block text-xs capitalize text-slate-500">{{ str_replace('_', ' ', $payment->payment_channel ?? $payment->provider) }}</span></td>
                    <td class="whitespace-nowrap px-5 py-4"><span class="font-bold">{{ $payment->order?->items->map(fn ($item) => $item->durationOption ? $item->durationOption->months.' months' : $item->duration_days.' days')->unique()->join(', ') ?: '—' }}</span><span class="block text-xs text-slate-500">{{ $payment->order?->items->pluck('duration_days')->filter()->unique()->join(', ') }} days</span></td>
                    <td class="whitespace-nowrap px-5 py-4 font-extrabold text-sky-700">{{ $payment->currency }} {{ number_format($payment->amount, 2) }}</td>
                    <td class="px-5 py-4"><span class="rounded-full px-2.5 py-1 text-xs font-bold capitalize {{ $payment->status === 'paid' ? 'bg-emerald-50 text-emerald-700' : ($payment->status === 'pending' ? 'bg-amber-50 text-amber-700' : ($payment->status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600')) }}">{{ $payment->status }}</span></td>
                    <td class="px-5 py-4 text-slate-700">{{ $payment->status === 'paid' ? 'Subscription activated' : ($payment->status === 'pending' ? 'Awaiting confirmation' : ($payment->status === 'cancelled' ? 'Cancelled or expired' : 'Payment not completed')) }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="px-5 py-8 text-center text-slate-500">No payment records yet.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    @if($payments->hasPages())<div class="border-t border-slate-200 p-4 sm:p-5">{{ $payments->withQueryString()->links() }}</div>@endif
</section>

<section class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:mt-8">
    <div class="border-b border-slate-200 p-4 sm:p-6"><h2 class="text-base font-extrabold text-[#082c58] sm:text-lg">Activation-code log</h2><p class="mt-1 text-sm text-slate-500">Includes checkout-generated and manually issued codes.</p></div>

    <div class="divide-y divide-slate-100 lg:hidden">
        @forelse($codes as $code)
            <article class="p-4 sm:p-5">
                <div class="flex flex-wrap items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p class="font-bold text-[#082c58]">{{ $code->package?->name ?? 'Package removed' }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ $code->duration_days ?: $code->package?->duration_days }} days · {{ str_replace('_', ' ', $code->source) }}</p>
                    </div>
                    <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize {{ $code->status === 'unused' ? 'bg-emerald-50 text-emerald-700' : ($code->status === 'redeemed' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700') }}">{{ $code->status }}</span>
                </div>
                <p class="mt-3 break-all font-mono text-sm font-bold text-slate-700">{{ $code->status === 'unused' ? $code->codeOrMask() : $code->maskedCode() }}</p>
                <dl class="mt-3 grid gap-3 min-[420px]:grid-cols-2">
                    <div><dt class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Issued</dt><dd class="mt-0.5 text-sm text-slate-700">{{ $code->created_at->format('d M Y, H:i') }}</dd></div>
                    <div class="min-w-0"><dt class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Child account</dt><dd class="mt-0.5 text-sm text-slate-700">@if($code->redeemedByChild)<span class="font-bold">{{ $code->redeemedByChild->name }}</span><span class="block truncate text-xs text-slate-500">{{ $code->redeemedByChild->username }} · {{ $code->redeemedByChild->student?->level?->name }}</span>@elseif($code->renewalChild)<span class="font-bold">{{ $code->renewalChild->name }}</span><span class="block truncate text-xs text-slate-500">{{ $code->renewalChild->username }} · {{ $code->renewalChild->student?->level?->name }}</span>@else<span class="text-slate-400">Not assigned</span>@endif</dd></div>
                </dl>
                <div class="mt-4 flex flex-wrap items-center gap-3">
                    @if($code->status === 'unused' && $code->intended_use === 'renewal' && $code->renewalChild?->student)
                        <a href="{{ route('parent.children.renew', ['childUuid' => $code->renewalChild->student->uuid, 'activation' => $code->uuid]) }}" class="rounded-xl bg-[#0788c9] px-4 py-2.5 text-xs font-bold text-white">Renew child</a>
                        <form method="POST" action="{{ route('parent.activation-codes.resend', $code->uuid) }}">@csrf<button class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Resend code email</button></form>
                    @elseif($code->status === 'unused')
                        <a href="{{ route('parent.children.create', ['activation' => $code->uuid]) }}" class="rounded-xl bg-[#0788c9] px-4 py-2.5 text-xs font-bold text-white">Create child account</a>
                        <form method="POST" action="{{ route('parent.activation-codes.resend', $code->uuid) }}">@csrf<button class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">Resend code email</button></form>
                    @else
                        <span class="text-xs font-semibold text-slate-400">Completed{{ $code->redeemed_at ? ' · '.$code->redeemed_at->format('d M Y, H:i') : '' }}</span>
                    @endif
                </div>
            </article>
        @empty
            <p class="p-6 text-center text-sm text-slate-500">No activation codes yet.</p>
        @endforelse
    </div>

    <div class="hidden overflow-x-auto lg:block">
        <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th class="px-5 py-3">Issued</th><th class="px-5 py-3">Package</th><th class="px-5 py-3">Code</th><th class="px-5 py-3">Status</th><th class="px-5 py-3">Child account</th><th class="px-5 py-3">Action / request</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
            @forelse($codes as $code)
                <tr class="align-top">
                    <td class="whitespace-nowrap px-5 py-4">{{ $code->created_at->format('d M Y, H:i') }}<span class="mt-1 block text-xs capitalize text-slate-500">{{ str_replace('_', ' ', $code->source) }}</span></td>
                    <td class="px-5 py-4"><span class="font-bold text-[#082c58]">{{ $code->package?->name ?? 'Package removed' }}</span><span class="mt-1 block text-xs text-slate-500">{{ $code->duration_days ?: $code->package?->duration_days }} days</span></td>
                    <td class="px-5 py-4 font-mono font-bold text-slate-700">{{ $code->status === 'unused' ? $code->codeOrMask() : $code->maskedCode() }}</td>
                    <td class="px-5 py-4"><span class="rounded-full px-2.5 py-1 text-xs font-bold capitalize {{ $code->status === 'unused' ? 'bg-emerald-50 text-emerald-700' : ($code->status === 'redeemed' ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700') }}">{{ $code->status }}</span>@if($code->redeemed_at)<span class="mt-2 block whitespace-nowrap text-xs text-slate-500">{{ $code->redeemed_at->format('d M Y, H:i') }}</span>@endif</td>
                    <td class="px-5 py-4">@if($code->redeemedByChild)<span class="font-bold">{{ $code->redeemedByChild->name }}</span><span class="block text-xs text-slate-500">{{ $code->redeemedByChild->username }} · {{ $code->redeemedByChild->student?->level?->name }}</span>@elseif($code->renewalChild)<span class="font-bold">{{ $code->renewalChild->name }}</span><span class="block text-xs text-slate-500">{{ $code->renewalChild->username }} · {{ $code->renewalChild->student?->level?->name }}</span>@else<span class="text-slate-400">Not assigned</span>@endif</td>
                    <td class="px-5 py-4">@if($code->status === 'unused' && $code->intended_use === 'renewal' && $code->renewalChild?->student)<a href="{{ route('parent.children.renew', ['childUuid' => $code->renewalChild->student->uuid, 'activation' => $code->uuid]) }}" class="font-bold text-sky-700">Renew child</a><form method="POST" action="{{ route('parent.activation-codes.resend', $code->uuid) }}" class="mt-2">@csrf<button class="text-xs font-bold text-slate-600 hover:text-sky-700">Resend code email</button></form>@elseif($code->status === 'unused')<a href="{{ route('parent.children.create', ['activation' => $code->uuid]) }}" class="font-bold text-sky-700">Create child account</a><form method="POST" action="{{ route('parent.activation-codes.resend', $code->uuid) }}" class="mt-2">@csrf<button class="text-xs font-bold text-slate-600 hover:text-sky-700">Resend code email</button></form>@else<span class="text-slate-400">Completed</span>@endif</td>
                </tr>
            @empty
                <tr><td colspan="6" class="px-5 py-8 text-center text-slate-500">No activation codes yet.</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    @if($codes->hasPages())<div class="border-t border-slate-200 p-4 sm:p-5">{{ $codes->withQueryString()->links() }}</div>@endif
</section>
@endsection
