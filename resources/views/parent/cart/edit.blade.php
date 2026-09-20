@extends('layouts.parent')
@section('title', 'Edit Cart Item')
@section('content')
<div class="mx-auto max-w-4xl">
    <a href="{{ route('parent.cart.index') }}" class="text-sm font-bold text-sky-700">← Back to cart</a>
    <div class="mt-4"><p class="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Edit cart item</p><h1 class="mt-2 break-words text-2xl font-extrabold text-[#082c58] sm:text-3xl">{{ $item->package_name_snapshot }}</h1><p class="mt-2 text-sm text-slate-600 sm:text-base">Update the child details before making the combined payment.</p></div>

    <form method="POST" action="{{ route('parent.cart.items.update', $item->uuid) }}" class="mt-6 grid gap-5 sm:mt-7 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        @csrf @method('PATCH')
        <div class="min-w-0 space-y-5 sm:space-y-6">
            <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 class="text-base font-extrabold text-[#082c58] sm:text-lg">Subscription duration</h2>
                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    @foreach($item->package->durationOptions as $option)
                        <label class="cursor-pointer rounded-2xl border-2 p-4 transition has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 sm:p-5">
                            <input type="radio" name="duration_option_id" value="{{ $option->id }}" class="sr-only" @checked((string) old('duration_option_id', $item->package_duration_option_id) === (string) $option->id) required>
                            <span class="block text-lg font-extrabold text-[#082c58] sm:text-xl">{{ $option->months }} months</span>
                            <span class="mt-2 block text-xl font-extrabold text-sky-700 sm:text-2xl">{{ $option->currency }} {{ number_format($option->price, 2) }}</span>
                        </label>
                    @endforeach
                </div>
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <h2 class="text-base font-extrabold text-[#082c58] sm:text-lg">Child account information</h2>
                <div class="mt-5 grid gap-5 sm:grid-cols-2">
                    <label class="sm:col-span-2"><span class="text-sm font-bold text-slate-700">Child name</span><input name="name" value="{{ old('name', $item->new_child_name) }}" required maxlength="255" class="mt-2 w-full rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500"></label>
                    <label class="sm:col-span-2"><span class="text-sm font-bold text-slate-700">Username</span><input name="username" value="{{ old('username', $item->new_child_username) }}" required minlength="4" maxlength="40" pattern="[A-Za-z0-9_-]+" autocomplete="off" class="mt-2 w-full rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500"></label>
                    <label><span class="text-sm font-bold text-slate-700">New password</span><input type="password" name="password" minlength="8" autocomplete="new-password" class="mt-2 w-full rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500"><span class="mt-1 block text-xs text-slate-500">Leave blank to keep the password entered earlier.</span></label>
                    <label><span class="text-sm font-bold text-slate-700">Confirm new password</span><input type="password" name="password_confirmation" minlength="8" autocomplete="new-password" class="mt-2 w-full rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500"></label>
                    <label><span class="text-sm font-bold text-slate-700">Child level</span><select name="level_id" required class="mt-2 w-full rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500">@foreach($item->package->levels as $level)<option value="{{ $level->id }}" @selected((string) old('level_id', $item->new_child_level_id) === (string) $level->id)>{{ $level->name }}</option>@endforeach</select></label>
                    <label><span class="text-sm font-bold text-slate-700">Class name</span><input name="class_name" value="{{ old('class_name', $item->new_child_class_name) }}" maxlength="50" class="mt-2 w-full rounded-xl border-slate-300 focus:border-sky-500 focus:ring-sky-500"></label>
                </div>
            </section>
        </div>

        <aside class="h-fit min-w-0 rounded-2xl bg-[#082c58] p-5 text-white shadow-xl sm:p-6 lg:sticky lg:top-[5.5rem]"><p class="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Cart item</p><h2 class="mt-2 break-words text-xl font-extrabold">{{ $item->package_name_snapshot }}</h2><p class="mt-4 text-sm text-sky-100">Changes remain pending. The child account is created only after payment.</p><button class="mt-6 w-full rounded-xl bg-[#f2c237] px-4 py-3 font-extrabold text-[#082c58] hover:bg-yellow-300">Save changes</button></aside>
    </form>
</div>
@endsection
