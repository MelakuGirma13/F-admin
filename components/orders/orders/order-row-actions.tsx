"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  CreditCard,
  CircleOff,
  ChevronRight,
  Ban,
  Copy,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { ORDER_STATUSES, ORDER_STATUS_LABELS } from "@/types/orders";
import type { Order, OrderStatus } from "@/types/orders";
import { cancelOrderAction, toggleOrderPaidAction, updateOrderStatusAction } from "@/app/actions/orders/orders";

interface OrderRowActionsProps {
  order: Order;
  onViewDetails: (order: Order) => void;
}

export function OrderRowActions({ order, onViewDetails }: OrderRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isCancelled = order.status === "CANCELLED";

  function run(key: string, fn: () => Promise<{ error?: string }>) {
    setPendingAction(key);
    startTransition(async () => {
      const result = await fn();
      if (result.error) {
        toast.error(result.error);
      }
      setPendingAction(null);
    });
  }

  function handleStatusChange(status: OrderStatus) {
    run(`status-${status}`, async () => {
      const res = await updateOrderStatusAction(order.id, status);
      if (!res.error)
        toast.success(`Order ${order.id} moved to "${ORDER_STATUS_LABELS[status]}".`);
      return res;
    });
  }

  function handleTogglePaid() {
    const next = !order.is_paid;
    run("paid", async () => {
      const res = await toggleOrderPaidAction(order.id, next);
      if (!res.error)
        toast.success(`Order ${order.id} marked as ${next ? "paid" : "unpaid"}.`);
      return res;
    });
  }

  function handleCancel() {
    run("cancel", async () => {
      const res = await cancelOrderAction(order.id);
      if (!res.error) toast.success(`Order ${order.id} has been cancelled.`);
      return res;
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(order.id);
    toast.success("Order ID copied to clipboard.");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-50 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            disabled={isPending}
            aria-label={`Actions for order ${order.id}`}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => onViewDetails(order)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/orders/${order.id}/edit`} className="flex items-center cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              Edit order
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copy order ID
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleTogglePaid}
            disabled={isPending || isCancelled}
          >
            {pendingAction === "paid" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : order.is_paid ? (
              <CircleOff className="mr-2 h-4 w-4" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            {order.is_paid ? "Mark as unpaid" : "Mark as paid"}
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={isPending || isCancelled}>
              <ChevronRight className="mr-2 h-4 w-4" />
              Update status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {ORDER_STATUSES.filter((s) => s !== "CANCELLED").map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={order.status === s || isPending}
                  className={order.status === s ? "font-semibold" : ""}
                >
                  {pendingAction === `status-${s}` && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  {ORDER_STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setCancelOpen(true)}
            disabled={isPending || isCancelled}
            className="text-destructive focus:text-destructive"
          >
            {pendingAction === "cancel" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            Cancel order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel order {order.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently mark the order as cancelled. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default">Keep order</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="default"
              onClick={() => {
                setCancelOpen(false);
                handleCancel();
              }}
            >
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
