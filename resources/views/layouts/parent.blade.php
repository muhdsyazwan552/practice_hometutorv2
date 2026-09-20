<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#082c58">
    <title>@yield('title', 'Parent Portal') · {{ config('app.name', 'HomeTutor') }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    @vite('resources/css/app.css')
</head>
@php
    $navItems = [
        [
            'label' => 'Dashboard',
            'url' => route('parent.dashboard'),
            'active' => request()->routeIs('parent.dashboard'),
            'icon' => '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
        ],
        [
            'label' => 'Children',
            'url' => route('parent.children.index'),
            'active' => request()->routeIs('parent.children.*'),
            'icon' => '<circle cx="9" cy="8" r="3.2"/><path stroke-linecap="round" d="M3 20a6 6 0 0 1 12 0M16.5 5.2a3.2 3.2 0 0 1 0 5.9M21 20a5 5 0 0 0-3.4-4.4"/>',
        ],
        [
            'label' => 'Packages & Codes',
            'url' => route('parent.subscriptions.index'),
            'active' => request()->routeIs('parent.subscriptions.*') || request()->routeIs('parent.packages.*'),
            'icon' => '<path stroke-linecap="round" stroke-linejoin="round" d="M4 5h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6V6a1 1 0 0 1 1-1Z"/><path stroke-linecap="round" d="M12 8.5v1.5m0 2v1.5m0 2V17"/>',
        ],
        [
            'label' => 'Payment Log',
            'url' => route('parent.payment-log.index'),
            'active' => request()->routeIs('parent.payment-log.*'),
            'icon' => '<path stroke-linecap="round" stroke-linejoin="round" d="M5 3h14a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-3-2V4a1 1 0 0 1 1-1Z"/><path stroke-linecap="round" d="M8.5 8h7M8.5 12h7"/>',
        ],
        [
            'label' => 'Cart',
            'url' => route('parent.cart.index'),
            'active' => request()->routeIs('parent.cart.*'),
            'badge' => $cartItemCount,
            'icon' => '<path stroke-linecap="round" stroke-linejoin="round" d="M3 4h2l1.7 10.1a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.4L21 7H6M9 20h.01M17 20h.01"/>',
        ],
    ];
@endphp
<body class="min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-800 antialiased">
<div class="min-h-screen lg:flex">
    <div id="parent-sidebar-overlay" class="fixed inset-0 z-40 hidden bg-slate-950/50 backdrop-blur-sm lg:hidden"></div>

    <aside id="parent-sidebar"
           class="fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] -translate-x-full flex-col bg-[#082c58] text-blue-100 shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-[16rem] lg:max-w-none lg:translate-x-0 lg:shadow-none xl:w-[17rem]"
           aria-label="Parent navigation">
        <div class="flex h-[4.5rem] shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 sm:px-5">
            <a href="{{ route('parent.dashboard') }}" class="flex min-w-0 items-center gap-2.5">
                <img src="/images/HT_Rectangle_3D.png" alt="HomeTutor" class="h-9 w-auto shrink-0 object-contain">
                <span class="min-w-0">
                    <span class="block truncate text-sm font-bold text-white">Parent Portal</span>
                    <span class="block truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200">HomeTutor</span>
                </span>
            </a>
            <button type="button" id="parent-sidebar-close" class="-mr-1 rounded-lg p-2 text-blue-200 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close navigation">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5" aria-hidden="true"><path stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
        </div>

        <nav class="flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-4">
            <p class="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300/70">Menu</p>
            <ul class="mt-3 space-y-1">
                @foreach ($navItems as $item)
                    <li>
                        <a href="{{ $item['url'] }}"
                           data-sidebar-link
                           @if($item['active']) aria-current="page" @endif
                           class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition {{ $item['active'] ? 'bg-white/15 text-white shadow-inner' : 'text-blue-100 hover:bg-white/10 hover:text-white' }}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-5 w-5 shrink-0" aria-hidden="true">{!! $item['icon'] !!}</svg>
                            <span class="min-w-0 flex-1 truncate">{{ $item['label'] }}</span>
                            @if (($item['badge'] ?? 0) > 0)
                                <span class="flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-extrabold leading-none text-white">{{ $item['badge'] > 99 ? '99+' : $item['badge'] }}</span>
                            @endif
                        </a>
                    </li>
                @endforeach
            </ul>

            <p class="mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300/70">Account</p>
            <ul class="mt-3 space-y-1">
                <li>
                    <a href="{{ route('parent.profile.edit') }}"
                       data-sidebar-link
                       @if(request()->routeIs('parent.profile.*')) aria-current="page" @endif
                       class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition {{ request()->routeIs('parent.profile.*') ? 'bg-white/15 text-white shadow-inner' : 'text-blue-100 hover:bg-white/10 hover:text-white' }}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" class="h-5 w-5 shrink-0" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path stroke-linecap="round" d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/></svg>
                        <span class="min-w-0 flex-1 truncate">Profile & password</span>
                    </a>
                </li>
            </ul>
        </nav>

        <div class="shrink-0 border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
            <div class="rounded-2xl bg-white/10 p-3">
                <div class="flex min-w-0 items-center gap-2.5">
                    <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">{{ strtoupper(substr(auth()->user()->name, 0, 1)) }}</span>
                    <span class="min-w-0">
                        <span class="block truncate text-sm font-bold text-white">{{ auth()->user()->name }}</span>
                        <span class="block truncate text-xs text-blue-200">{{ auth()->user()->email }}</span>
                    </span>
                </div>
                <form method="POST" action="{{ route('logout') }}" class="mt-3">@csrf
                    <button class="w-full rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-blue-100 transition hover:bg-white/10 hover:text-white">Log out</button>
                </form>
            </div>
        </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 flex h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div class="flex min-w-0 items-center gap-3">
                <button type="button" id="parent-sidebar-open" class="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 lg:hidden" aria-label="Open navigation" aria-controls="parent-sidebar" aria-expanded="false">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5" aria-hidden="true"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <div class="min-w-0">
                    <p class="truncate text-base font-bold text-[#082c58] sm:text-lg">@yield('title', 'Parent Portal')</p>
                    <p class="hidden truncate text-xs text-slate-400 sm:block">Manage licences, children and payments</p>
                </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
                <a href="{{ route('parent.cart.index') }}" aria-label="Cart with {{ $cartItemCount }} {{ Str::plural('item', $cartItemCount) }}" title="Package cart"
                   class="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-5 w-5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 4h2l1.7 10.1a2 2 0 0 0 2 1.7h7.9a2 2 0 0 0 1.9-1.4L21 7H6M9 20h.01M17 20h.01"/></svg>
                    @if($cartItemCount > 0)
                        <span class="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white">{{ $cartItemCount > 99 ? '99+' : $cartItemCount }}</span>
                    @endif
                </a>

                <details class="group relative" id="parent-account-menu">
                    <summary class="flex cursor-pointer list-none items-center gap-2 rounded-xl bg-[#082c58] px-2.5 py-2 text-white transition hover:bg-[#0b407c] sm:px-3">
                        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold">{{ strtoupper(substr(auth()->user()->name, 0, 1)) }}</span>
                        <span class="hidden max-w-32 truncate text-sm font-semibold sm:block">{{ auth()->user()->name }}</span>
                        <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0 transition group-open:rotate-180" aria-hidden="true"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clip-rule="evenodd"/></svg>
                    </summary>
                    <div class="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-xl">
                        <div class="border-b border-slate-100 px-4 py-3">
                            <p class="truncate text-sm font-bold text-[#082c58]">{{ auth()->user()->name }}</p>
                            <p class="mt-0.5 truncate text-xs text-slate-500">{{ auth()->user()->email }}</p>
                            @if(auth()->user()->mobile_number)<p class="mt-1 truncate text-xs text-slate-500">{{ auth()->user()->mobile_number }}</p>@endif
                        </div>
                        <a href="{{ route('parent.profile.edit') }}" class="block px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-700">Profile & password</a>
                        <form method="POST" action="{{ route('logout') }}" class="border-t border-slate-100">@csrf<button class="w-full px-4 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">Log out</button></form>
                    </div>
                </details>
            </div>
        </header>

        <main class="min-w-0 flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8">
            @if (session('success'))
                <div class="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{{ session('success') }}</div>
            @endif
            @if (session('error'))
                <div class="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{{ session('error') }}</div>
            @endif
            @if ($errors->any())
                <div class="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"><ul class="list-disc pl-5">@foreach($errors->all() as $error)<li>{{ $error }}</li>@endforeach</ul></div>
            @endif
            <div class="mx-auto max-w-7xl">
                @yield('content')
            </div>
        </main>
    </div>
</div>

<script>
(() => {
    const sidebar = document.getElementById('parent-sidebar');
    const overlay = document.getElementById('parent-sidebar-overlay');
    const openButton = document.getElementById('parent-sidebar-open');
    const closeButton = document.getElementById('parent-sidebar-close');
    const accountMenu = document.getElementById('parent-account-menu');
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

    const open = () => {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
        document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
        openButton?.setAttribute('aria-expanded', 'true');
        closeButton?.focus();
    };

    const close = () => {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
        openButton?.setAttribute('aria-expanded', 'false');
    };

    openButton?.addEventListener('click', open);
    closeButton?.addEventListener('click', close);
    overlay?.addEventListener('click', close);

    // Tapping a menu item on a phone or tablet should reveal the page behind the drawer.
    sidebar.querySelectorAll('[data-sidebar-link]').forEach((link) => {
        link.addEventListener('click', () => { if (!isDesktop()) close(); });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        close();
        if (accountMenu) accountMenu.open = false;
    });

    // Rotating a tablet into desktop width must not leave the body scroll-locked.
    window.addEventListener('resize', () => { if (isDesktop()) close(); });

    document.addEventListener('click', (event) => {
        if (accountMenu?.open && !accountMenu.contains(event.target)) accountMenu.open = false;
    });
})();
</script>
@stack('scripts')
</body>
</html>
