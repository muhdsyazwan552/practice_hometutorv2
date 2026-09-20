@extends('layouts.parent')

@section('title', 'Create Child')

@section('content')
    @php
        // A code encrypted under an earlier APP_KEY cannot be prefilled, so the
        // form falls back to the manual "check code" flow instead of locking a
        // readonly empty field.
        $prefilledCode = $automaticCode?->code_value;
        $autoPrefilled = (bool) $prefilledCode;
    @endphp
    <div class="mx-auto max-w-2xl">
        <a href="{{ route('parent.children.index') }}" class="text-sm font-bold text-sky-700">← Back to children</a>
        <div class="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <h1 class="text-xl font-bold text-[#082c58] sm:text-2xl">Create a child login</h1>
            <p class="mt-2 text-sm text-slate-500">{{ $autoPrefilled ? 'Payment successful. Your purchased package is included automatically—complete the child details below.' : 'Validate a single-use activation code first. The code determines which learning levels are available.' }}</p>

            <form id="child-form" method="POST" action="{{ route('parent.children.store') }}" class="mt-6 space-y-5 sm:mt-7">
                @csrf
                <div class="rounded-2xl border border-sky-200 bg-sky-50 p-3 sm:p-4">
                    <label class="block"><span class="text-sm font-bold text-slate-700">Activation code</span><div class="mt-2 flex flex-col gap-2 sm:flex-row"><input id="activation-code" name="activation_code" value="{{ old('activation_code', $prefilledCode) }}" required autocomplete="off" @readonly($autoPrefilled) class="block min-w-0 flex-1 rounded-xl border-slate-200 font-mono uppercase focus:border-sky-500 focus:ring-sky-500 {{ $autoPrefilled ? 'bg-white text-emerald-800' : '' }}" placeholder="HT-XXXX-XXXX-XXXX-XXXX-XXXX">@unless($autoPrefilled)<button id="check-code" type="button" class="shrink-0 rounded-xl bg-[#082c58] px-4 py-3 text-sm font-bold text-white sm:py-2">Check code</button>@endunless</div>@error('activation_code')<span class="mt-1 block text-sm text-rose-600">{{ $message }}</span>@enderror</label>
                    <p id="code-status" class="mt-2 text-sm font-semibold {{ $autoPrefilled ? 'text-emerald-700' : ($automaticCode ? 'text-amber-700' : 'text-slate-500') }}">{{ $autoPrefilled ? 'Included automatically: '.$automaticCode->package->name.' · '.$automaticCode->package->duration_days.' days' : ($automaticCode ? 'This code could not be read on this server. Enter the code from your activation email, ending '.$automaticCode->code_last_four.'.' : 'Enter the code emailed after payment approval.') }}</p>
                </div>
                <fieldset id="child-fields" @disabled(!$autoPrefilled) class="space-y-5 disabled:opacity-50">
                <label class="block"><span class="text-sm font-bold text-slate-700">Child name</span><input name="name" value="{{ old('name') }}" required class="mt-2 block w-full rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500">@error('name')<span class="mt-1 block text-sm text-rose-600">{{ $message }}</span>@enderror</label>
                <label class="block"><span class="text-sm font-bold text-slate-700">Login username</span><input name="username" value="{{ old('username') }}" required autocomplete="off" class="mt-2 block w-full rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500">@error('username')<span class="mt-1 block text-sm text-rose-600">{{ $message }}</span>@enderror</label>
                <div class="grid gap-5 sm:grid-cols-2">
                    <label class="block"><span class="text-sm font-bold text-slate-700">Password</span><input type="password" name="password" required autocomplete="new-password" class="mt-2 block w-full rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500">@error('password')<span class="mt-1 block text-sm text-rose-600">{{ $message }}</span>@enderror</label>
                    <label class="block"><span class="text-sm font-bold text-slate-700">Confirm password</span><input type="password" name="password_confirmation" required autocomplete="new-password" class="mt-2 block w-full rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500"></label>
                </div>
                <div class="grid gap-5 sm:grid-cols-2">
                    <label class="block"><span class="text-sm font-bold text-slate-700">Level</span><select id="level-select" name="level_id" required class="mt-2 block w-full rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500"><option value="">{{ $autoPrefilled ? 'Select child level' : 'Validate code first' }}</option>@foreach($levels as $level)<option value="{{ $level->id }}" data-level-option @if(!$autoPrefilled || !$automaticCode->package->levels->contains('id', $level->id)) hidden @endif @selected(old('level_id') == $level->id)>{{ $level->name }}</option>@endforeach</select>@error('level_id')<span class="mt-1 block text-sm text-rose-600">{{ $message }}</span>@enderror</label>
                    <label class="block"><span class="text-sm font-bold text-slate-700">Class</span><input name="class_name" value="{{ old('class_name') }}" class="mt-2 block w-full rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500">@error('class_name')<span class="mt-1 block text-sm text-rose-600">{{ $message }}</span>@enderror</label>
                </div>
                <button class="w-full rounded-xl bg-[#0788c9] px-5 py-3 font-bold text-white hover:bg-[#056fa7]">Create child account</button>
                </fieldset>
            </form>
        </div>
    </div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('activation-code');
    const button = document.getElementById('check-code');
    const status = document.getElementById('code-status');
    const fields = document.getElementById('child-fields');
    const levelSelect = document.getElementById('level-select');
    const oldLevel = @json((string) old('level_id'));

    if (!button) return;
    button.addEventListener('click', async () => {
        fields.disabled = true;
        status.className = 'mt-2 text-sm font-semibold text-slate-500';
        status.textContent = 'Checking code…';
        try {
            const response = await fetch(@json(route('parent.activation-codes.validate')), {
                method: 'POST',
                headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content},
                body: JSON.stringify({activation_code: input.value})
            });
            const data = await response.json();
            if (!response.ok || !data.valid) throw new Error(data.message || 'Invalid activation code');

            const allowed = new Set(data.levels.map(level => String(level.id)));
            levelSelect.querySelectorAll('[data-level-option]').forEach(option => option.hidden = !allowed.has(option.value));
            levelSelect.value = allowed.has(oldLevel) ? oldLevel : '';
            fields.disabled = false;
            status.className = 'mt-2 text-sm font-semibold text-emerald-700';
            status.textContent = `Valid: ${data.package.name} · ${data.package.duration_days} days`;
        } catch (error) {
            status.className = 'mt-2 text-sm font-semibold text-rose-700';
            status.textContent = 'Code is invalid, expired, used, or not available for this parent.';
        }
    });
});
</script>
@endpush
