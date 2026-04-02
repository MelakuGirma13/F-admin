import type { Metadata } from "next";
import { CreateOrderForm } from "@/components/orders/create-order/create-order-form";

export const metadata: Metadata = {
  title: "Create Order",
  description: "Create a new customer order",
  openGraph: {
    title: "Create Order | Orders Admin",
    description: "Create a new customer order",
  },
};

export default function CreateOrderPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CreateOrderForm />
    </div>
  );
}
