import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderById } from "@/lib/orders";
import { EditOrderForm } from "@/components/orders/edit-order/edit-order-form";

interface EditOrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditOrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Order ${id}`,
    description: `Edit and update order ${id}`,
  };
}

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  const { id } = await params;

  let order;
  try {
    order = await getOrderById(id);
  } catch {
    notFound();
  }

  return <EditOrderForm order={order} />;
}
