@extends('layouts.parent')
@section('title', 'Payment status')
@section('content')
<div class="mx-auto max-w-lg">
    <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        @if($transaction->status === 'pending')
            <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600"></div>
            <h1 class="mt-5 text-xl font-extrabold text-[#082c58]">Confirming your payment…</h1>
            <p class="mt-2 text-sm text-slate-600">DOKU is confirming your payment. This page will refresh automatically.</p>
        @elseif($order->status === 'expired' || $transaction->message === 'expired')
            <div class="mx-auto text-4xl">⏳</div>
            <h1 class="mt-5 text-xl font-extrabold text-[#082c58]">Payment timed out</h1>
            <p class="mt-2 text-sm text-slate-600">The checkout session expired before payment was completed. No charge was made. You can try again.</p>
            <a href="{{ route('parent.subscriptions.index') }}" class="mt-6 inline-block rounded-xl bg-[#082c58] px-5 py-3 text-sm font-bold text-white">Try again</a>
        @elseif(in_array($transaction->status, ['failed', 'cancelled']))
            <div class="mx-auto text-4xl">⚠️</div>
            <h1 class="mt-5 text-xl font-extrabold text-[#082c58]">Payment was not successful</h1>
            <p class="mt-2 text-sm text-slate-600">No child account was created and no activation code was used. You can try again.</p>
            <a href="{{ route('parent.subscriptions.index') }}" class="mt-6 inline-block rounded-xl bg-[#082c58] px-5 py-3 text-sm font-bold text-white">Try again</a>
        @else
            <div class="mx-auto text-4xl">⏳</div>
            <h1 class="mt-5 text-xl font-extrabold text-[#082c58]">Status is still updating</h1>
            <p class="mt-2 text-sm text-slate-600">Please wait a moment or reload this page.</p>
        @endif
        <p class="mt-6 text-xs text-slate-400">Reference: {{ $transaction->provider_order_reference }}</p>
    </div>
</div>
@endsection
@if($transaction->status === 'pending')
@push('scripts')
<script>setTimeout(() => window.location.reload(), 3000);</script>
@endpush
@endif
