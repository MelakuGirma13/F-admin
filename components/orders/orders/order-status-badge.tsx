import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/orders";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: {
    label: "Pending",
    classes: "bg-status-pending/10 text-status-pending border-status-pending/20",
    dot: "bg-status-pending",
  },
  placed: {
    label: "Order Placed",
    classes: "bg-status-placed/10 text-status-placed border-status-placed/20",
    dot: "bg-status-placed",
  },
  processing: {
    label: "Processing",
    classes: "bg-status-processing/10 text-status-processing border-status-processing/20",
    dot: "bg-status-processing",
  },
  dispatched: {
    label: "Dispatched",
    classes: "bg-status-dispatched/10 text-status-dispatched border-status-dispatched/20",
    dot: "bg-status-dispatched",
  },
  completed: {
    label: "Completed",
    classes: "bg-status-completed/10 text-status-completed border-status-completed/20",
    dot: "bg-status-completed",
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20",
    dot: "bg-status-cancelled",
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export const OrderStatusBadge = ({
  status,
  className,
}: OrderStatusBadgeProps): React.ReactElement => {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.classes,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
};

export { STATUS_CONFIG };

interface IsPaidBadgeProps {
  isPaid: boolean;
  className?: string;
}

export const IsPaidBadge = ({ isPaid, className }: IsPaidBadgeProps): React.ReactElement => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      isPaid
        ? "bg-status-completed/10 text-status-completed border-status-completed/20"
        : "bg-muted/60 text-muted-foreground border-border",
      className
    )}
  >
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full shrink-0",
        isPaid ? "bg-status-completed" : "bg-muted-foreground/50"
      )}
    />
    {isPaid ? "Paid" : "Unpaid"}
  </span>
);
