<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Turns a provider-neutral draft Order into a real DOKU checkout session.
 * Fulfillment (creating the child, issuing the activation code) happens
 * later, once the return page or the DOKU webhook confirms payment
 * succeeded — see CartCheckoutService::fulfill().
 */
class GatewayCheckoutService
{
    public function __construct(private readonly DokuCheckoutService $doku) {}

    public function initiate(Order $order, User $parent): string
    {
        if (! $this->doku->isConfigured()) {
            throw ValidationException::withMessages(['payment' => 'Payment is not available right now. Please try again shortly.']);
        }

        $order = DB::transaction(function () use ($order) {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);
            $items = $locked->items()->with('package')->get();

            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['cart' => 'There is nothing to pay for.']);
            }

            if (! in_array($locked->status, [Order::STATUS_DRAFT, Order::STATUS_PENDING_PAYMENT, Order::STATUS_EXPIRED], true)) {
                throw ValidationException::withMessages(['cart' => 'This order can no longer be paid for.']);
            }

            $locked->update([
                'status' => Order::STATUS_PENDING_PAYMENT,
                'provider' => 'doku',
                'expires_at' => now()->addHour(),
            ]);

            return $locked;
        });

        $items = $order->items()->with('package')->get();
        $invoice = 'HT'.now()->format('ymdHis').Str::upper(Str::random(6));
        $expiresAt = now('UTC')->addHour();

        $transaction = PaymentTransaction::create([
            'order_id' => $order->id,
            'provider' => 'doku',
            'provider_order_reference' => $invoice,
            'status' => PaymentTransaction::STATUS_PENDING,
            'amount' => $order->total,
            'currency' => $order->currency,
            'payment_channel' => 'doku_checkout',
            'metadata' => ['checkout_expires_at' => $expiresAt->toIso8601String()],
        ]);

        $returnUrl = route('parent.orders.payment-return', ['order' => $order->uuid]);
        $payload = [
            'id' => (string) Str::uuid(),
            'order' => [
                'amount' => (float) $order->total,
                'invoice_number' => $invoice,
                'currency' => $order->currency,
                'line_items' => $items->map(fn ($item) => [
                    'id' => (string) $item->id,
                    'name' => Str::limit($item->package_name_snapshot ?? $item->package?->name ?? 'Hometutor Package', 100, ''),
                    'quantity' => 1,
                    'price' => (float) $item->total,
                    'sku' => 'HTPKG'.$item->package_id,
                    'category' => 'education',
                ])->all(),
                'expired_at' => $expiresAt->toIso8601String(),
            ],
            'checkout_experience' => [
                'language' => 'EN',
                'auto_redirect' => true,
                'retry_payment' => ['enabled' => true],
                'callback_url' => $returnUrl,
                'callback_url_cancel' => $returnUrl,
                'callback_url_result' => $returnUrl,
            ],
            'payment' => ['type' => 'SALE'],
            'metadata' => ['hometutor_order_id' => (string) $order->id],
            'customer' => array_filter([
                'id' => 'HT-PARENT-'.$parent->id,
                'name' => $parent->name,
                'email' => $parent->email,
                'phone' => $this->normalisePhone($parent->mobile_number),
                'country' => 'MY',
            ]),
        ];

        try {
            $checkout = $this->doku->createCheckout($payload);

            $transaction->update([
                'provider_transaction_reference' => data_get($checkout, 'id'),
                'status' => Str::lower((string) data_get($checkout, 'payment.status', 'pending')),
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'checkout_url' => data_get($checkout, 'payment.checkout_url'),
                    'gateway_state' => data_get($checkout, 'payment.state', 'INITIATE'),
                ]),
            ]);

            return $transaction->fresh()->metadata['checkout_url'];
        } catch (Throwable $exception) {
            $transaction->update([
                'status' => PaymentTransaction::STATUS_FAILED,
                'message' => Str::limit($exception->getMessage(), 191, ''),
            ]);
            $order->update(['status' => Order::STATUS_DRAFT]);

            report($exception);

            throw ValidationException::withMessages([
                'payment' => 'Payment could not be started. No charge was made. Please try again.',
            ]);
        }
    }

    private function normalisePhone(?string $phone): ?string
    {
        if (blank($phone)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (Str::startsWith($digits, '0')) {
            return '+60'.substr($digits, 1);
        }

        return Str::startsWith($phone, '+') ? '+'.$digits : '+'.$digits;
    }
}
