/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerById } from "@/lib/customers";
import { EditCustomerForm } from "@/components/customers/components/edit-customer-form";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditCustomerPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Customer ${id}`,
    description: `Edit and update customer ${id}`,
  };
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;

  let customer;
  try {
    customer = await getCustomerById(id);
  } catch {
    notFound();
  }

  return <EditCustomerForm customer={customer as any} />;
}
