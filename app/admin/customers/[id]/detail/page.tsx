/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerById } from "@/lib/customers";
import { CustomerDetail } from "@/components/customers/components/customer-detail-sheet";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CustomerDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Customer ${id}`,
    description: `View details for customer ${id}`,
  };
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  let customer;
  try {
    customer = await getCustomerById(id);
  } catch {
    notFound();
  }

  return <CustomerDetail customer={customer as any} />;
}
