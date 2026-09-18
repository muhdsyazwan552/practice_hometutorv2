<?php

namespace App\Http\Controllers\Parent;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentCallbackEvent;
use App\Models\PaymentTransaction;
use App\Services\CartCheckoutService;
use App\Services\DokuCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\View\View;
use Throwable;

class PaymentGatewayController extends Controller
{
    /**
     * The page the parent's browser lands on after DOKU's hosted checkout.
     * Polls DOKU for the latest status (the async webhook may not have
     * arrived yet) and fulfils the order as soon as payment is confirmed.
     */
    public function return(Request $request, Order $order, DokuCheckoutService $doku, CartCheckoutService $checkout): View|RedirectResponse
    {
        abort_unless((int) $order->parent_id === (int) $request->user()->id, 404);

        $transaction = $order->paymentTransactions()->latest('id')->first();
        abort_if(! $transaction, 404);

        if ($order->status === Order::STATUS_FULFILLED) {
            return redirect()->route('parent.children.index')->with('success', 'Payment successful! The child account and subscription are ready.');
        }

        if ($transaction->status === PaymentTransaction::STATUS_PENDING) {
            if ($order->expires_at && $order->expires_at->isPast()) {
                $transaction->update(['status' => PaymentTransaction::STATUS_CANCELLED, 'message' => 'expired']);
                $this->returnToDraft($order);
            } else {
                $this->syncFromGateway($order, $transaction, $doku, $checkout);
            }
        }

        $order = $order->fresh();
        $transaction = $transaction->fresh();

        if ($order->status === Order::STATUS_FULFILLED) {
            return redirect()->route('parent.children.index')->with('success', 'Payment successful! The child account and subscription are ready.');
        }

        return view('parent.checkout.payment_status', compact('order', 'transaction'));
    }

    /**
     * Server-to-server confirmation from DOKU. Public route, protected by the
     * HMAC signature check instead of auth — see DokuCheckoutService::verifyWebhook().
     */
    public function notification(Request $request, DokuCheckoutService $doku, CartCheckoutService $checkout): JsonResponse
    {
        $rawBody = $request->getContent();
        $requestPath = '/'.$request->path();
        $signatureValid = $doku->verifyWebhook($rawBody, $request->headers->all(), $requestPath);

        $payload = json_decode($rawBody, true);
        $invoice = is_array($payload) ? data_get($payload, 'order.invoice_number') : null;
        $checkoutId = is_array($payload) ? data_get($payload, 'id') : null;

        $transaction = filled($invoice)
            ? PaymentTransaction::where('provider', 'doku')->where('provider_order_reference', $invoice)->first()
            : null;

        $event = PaymentCallbackEvent::create([
            'payment_transaction_id' => $transaction?->id,
            'provider' => 'doku',
            'provider_order_reference' => $invoice,
            'provider_transaction_reference' => $checkoutId,
            'payment_status' => is_array($payload) ? Str::upper((string) data_get($payload, 'payment.status')) : null,
            'signature_valid' => $signatureValid,
            'payload' => is_array($payload) ? $payload : ['raw' => $rawBody],
            'received_at' => now(),
        ]);

        if (! $signatureValid) {
            $event->update(['processed_at' => now(), 'processing_result' => 'rejected', 'processing_error' => 'Invalid signature']);

            return response()->json(['message' => 'Invalid signature'], 401);
        }

        if (! is_array($payload)) {
            $event->update(['processed_at' => now(), 'processing_result' => 'rejected', 'processing_error' => 'Invalid JSON']);

            return response()->json(['message' => 'Invalid JSON'], 400);
        }

        if (! $transaction) {
            $event->update(['processed_at' => now(), 'processing_result' => 'not_found']);

            return response()->json(['message' => 'Payment not found'], 404);
        }

        if (! $this->amountsMatch($transaction, $payload)) {
            Log::critical('DOKU notification did not match local order', ['payment_transaction_id' => $transaction->id]);
            $event->update(['processed_at' => now(), 'processing_result' => 'mismatch', 'processing_error' => 'Amount/currency mismatch']);

            return response()->json(['message' => 'Order mismatch'], 422);
        }

        try {
            $this->applyStatus($transaction->order, $transaction, $payload, $checkout);
            $event->update(['processed_at' => now(), 'processing_result' => 'processed']);
        } catch (Throwable $exception) {
            report($exception);
            $event->update(['processed_at' => now(), 'processing_result' => 'error', 'processing_error' => Str::limit($exception->getMessage(), 500, '')]);
        }

        return response()->json(['message' => 'OK']);
    }

    private function syncFromGateway(Order $order, PaymentTransaction $transaction, DokuCheckoutService $doku, CartCheckoutService $checkout): void
    {
        if (blank($transaction->provider_transaction_reference)) {
            return;
        }

        try {
            $payload = $doku->retrieveCheckout($transaction->provider_transaction_reference);
        } catch (Throwable $exception) {
            report($exception);

            return;
        }

        if (! hash_equals((string) $transaction->provider_transaction_reference, (string) data_get($payload, 'id'))
            || ! $this->amountsMatch($transaction, $payload)) {
            Log::critical('DOKU checkout retrieval did not match local order', ['payment_transaction_id' => $transaction->id]);

            return;
        }

        $this->applyStatus($order, $transaction, $payload, $checkout);
    }

    private function applyStatus(Order $order, PaymentTransaction $transaction, array $payload, CartCheckoutService $checkout): void
    {
        $status = Str::upper((string) data_get($payload, 'payment.status'));
        $state = Str::upper((string) data_get($payload, 'payment.state'));

        if ($status === 'SUCCESS' && $state === 'COMPLETED') {
            $checkout->fulfill($order, $transaction);

            return;
        }

        if (in_array($status, ['PENDING', 'FAILED', 'EXPIRED', 'CANCELLED'], true)) {
            $transaction->update([
                'status' => $status === 'PENDING' ? PaymentTransaction::STATUS_PENDING : ($status === 'FAILED' ? PaymentTransaction::STATUS_FAILED : PaymentTransaction::STATUS_CANCELLED),
                'metadata' => array_merge($transaction->metadata ?? [], ['gateway_state' => $state ?: null]),
            ]);

            if ($status !== 'PENDING') {
                $this->returnToDraft($order);
            }
        }
    }

    /**
     * A failed/expired/cancelled payment leaves the order re-payable: reset it
     * back to draft (with a fresh cart window) so the parent's existing cart
     * or checkout page can retry without any separate "recover" flow.
     */
    private function returnToDraft(Order $order): void
    {
        $order->update(['status' => Order::STATUS_DRAFT, 'expires_at' => now()->addHours(2)]);
    }

    private function amountsMatch(PaymentTransaction $transaction, array $payload): bool
    {
        $currency = Str::upper((string) data_get($payload, 'order.currency'));
        $orderAmount = (float) data_get($payload, 'order.amount', -1);
        $paymentAmount = (float) data_get($payload, 'payment.amount', $orderAmount);

        return $currency === Str::upper($transaction->currency)
            && (int) round($orderAmount * 100) === (int) round((float) $transaction->amount * 100)
            && (int) round($paymentAmount * 100) === (int) round((float) $transaction->amount * 100);
    }
}
