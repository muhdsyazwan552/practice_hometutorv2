<?php

namespace App\Services;

use App\Mail\CartCheckoutReceipt;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class CartCheckoutService
{
    public function __construct(private readonly ActivationCodeService $activationCodes) {}

    /**
     * Create the child accounts and activation codes for every pending item on
     * an order, once a payment gateway has confirmed the order was paid.
     * Safe to call more than once for the same order (webhook retries and the
     * gateway return page can both land here) — a non-pending order is a no-op.
     */
    public function fulfill(Order $order, PaymentTransaction $transaction): array
    {
        $result = DB::transaction(function () use ($order, $transaction): array {
            $order = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

            if (in_array($order->status, [Order::STATUS_PAID, Order::STATUS_FULFILLED], true)) {
                return ['order' => $order, 'transaction' => $transaction, 'already_fulfilled' => true];
            }

            $parent = $order->parent;
            $items = $order->items()
                ->with(['package', 'durationOption', 'child.student'])
                ->where('fulfillment_status', OrderItem::FULFILLMENT_PENDING)
                ->lockForUpdate()
                ->get();

            foreach ($items as $item) {
                if ($item->item_type === OrderItem::TYPE_RENEWAL) {
                    $this->fulfillRenewalItem($item, $order, $parent, $transaction);

                    continue;
                }

                if (User::query()->where('username', $item->new_child_username)->exists()) {
                    $item->update([
                        'fulfillment_status' => OrderItem::FULFILLMENT_FAILED,
                        'failure_reason' => "Username {$item->new_child_username} was taken before payment completed.",
                    ]);

                    continue;
                }

                $child = User::create([
                    'name' => $item->new_child_name,
                    'display_name' => $item->new_child_name,
                    'username' => $item->new_child_username,
                    'email' => $item->new_child_username.'@children.hometutor.local',
                    'password' => $item->new_child_password_hash,
                    'role_id' => User::ROLE_CHILD,
                    'is_active' => true,
                ]);

                Student::create([
                    'user_id' => $child->id,
                    'parent_id' => $parent->id,
                    'code' => 'HT-'.Str::upper(Str::random(10)),
                    'full_name' => $item->new_child_name,
                    'level_id' => $item->new_child_level_id,
                    'class_name' => $item->new_child_class_name,
                ]);

                $code = $this->activationCodes->issue(
                    package: $item->package,
                    parent: $parent,
                    source: 'cart_checkout',
                    generatedBy: $parent,
                    reason: "Automatically generated for {$order->order_number}.",
                    email: $parent->email,
                    intendedUse: 'new',
                    durationDays: $item->duration_days,
                    purchaseAmount: $item->total,
                    sendEmail: false,
                );
                $code->update(['metadata' => [
                    'order_id' => $order->id,
                    'order_item_id' => $item->id,
                    'payment_transaction_id' => $transaction->id,
                ]]);

                $this->activationCodes->redeem(
                    $code->code_value,
                    $parent,
                    $child,
                    (int) $item->new_child_level_id,
                    null,
                    'new',
                    $item,
                    $transaction,
                );

                $item->update([
                    'fulfillment_status' => OrderItem::FULFILLMENT_FULFILLED,
                    'fulfilled_child_user_id' => $child->id,
                    'fulfilled_at' => now(),
                ]);
                $item->usernameReservation?->update(['released_at' => now()]);
            }

            $transaction->update([
                'status' => PaymentTransaction::STATUS_PAID,
                'paid_at' => now(),
            ]);

            $order->update([
                'status' => Order::STATUS_FULFILLED,
                'paid_at' => now(),
            ]);

            return ['order' => $order->fresh(), 'transaction' => $transaction->fresh(), 'already_fulfilled' => false];
        });

        $result['receipt_sent'] = false;

        if (! $result['already_fulfilled']) {
            try {
                $order = $result['order']->load(['items.package', 'items.durationOption', 'items.fulfilledChild.student.level', 'parent']);
                Mail::to($order->parent->email)->send(new CartCheckoutReceipt($order, $result['transaction']));
                $result['receipt_sent'] = true;
            } catch (Throwable $exception) {
                report($exception);
            }
        }

        return $result;
    }

    private function fulfillRenewalItem(OrderItem $item, Order $order, User $parent, PaymentTransaction $transaction): void
    {
        $child = $item->child;

        if (! $child || ! $child->student) {
            $item->update([
                'fulfillment_status' => OrderItem::FULFILLMENT_FAILED,
                'failure_reason' => 'The child for this renewal no longer exists.',
            ]);

            return;
        }

        $code = $this->activationCodes->issue(
            package: $item->package,
            parent: $parent,
            source: 'renewal_checkout',
            generatedBy: $parent,
            reason: "Automatically generated for {$order->order_number}.",
            email: $parent->email,
            intendedUse: 'renewal',
            renewalChild: $child,
            durationDays: $item->duration_days,
            purchaseAmount: $item->total,
            sendEmail: false,
        );
        $code->update(['metadata' => [
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'payment_transaction_id' => $transaction->id,
        ]]);

        $this->activationCodes->redeem(
            $code->code_value,
            $parent,
            $child,
            (int) $child->student->level_id,
            null,
            'renewal',
            $item,
            $transaction,
        );

        $item->update([
            'fulfillment_status' => OrderItem::FULFILLMENT_FULFILLED,
            'fulfilled_child_user_id' => $child->id,
            'fulfilled_at' => now(),
        ]);
    }
}
