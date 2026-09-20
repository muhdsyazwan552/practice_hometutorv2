@extends('layouts.parent')

@section('title', 'Children')

@section('content')
    <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div><p class="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 sm:text-sm">Family</p><h1 class="mt-2 text-2xl font-bold text-[#082c58] sm:text-3xl">Child accounts</h1></div>
        <a href="{{ route('parent.children.create') }}" class="w-full rounded-xl bg-[#f2c237] px-5 py-3 text-center text-sm font-bold text-[#082c58] sm:w-auto">Create child with code</a>
    </div>

    <div class="mt-6 grid gap-4 sm:mt-7 sm:gap-6 xl:grid-cols-2">
        @forelse ($children as $child)
            @include('parent.children._progress-card', ['child' => $child])
        @empty
            <div class="rounded-2xl border border-slate-200 bg-white p-8 text-center xl:col-span-2"><p class="font-bold text-slate-700">No child accounts yet</p><p class="mt-2 text-sm text-slate-500">Get an activation code, then create a child username.</p></div>
        @endforelse
    </div>
@endsection
