import type { Metadata } from "next";
import { CreateCustomerForm } from "@/components/customers/components/create-customer-form";

export const metadata: Metadata = {
  title: "Create Customer",
  description: "Add a new customer to the system",
  openGraph: {
    title: "Create Customer | Customers Admin",
    description: "Add a new customer profile",
  },
};

export default function CreateCustomerPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CreateCustomerForm />
    </div>
  );
}
