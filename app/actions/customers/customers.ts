"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  addAddressToCustomer,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type CreateCustomerInput,
  type CreateAddressInput,
} from "@/lib/customers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------
// Zod schemas
const addressSchema = z.object({
  addressType: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  addressLine1: z.string().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  locality: z.string().nullable().optional(),
  administrativeDistrictLevel1: z.string().nullable().optional(),
  sublocality: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  squareAddressId: z.string().nullable().optional(),
});

const createCustomerSchema = z.object({
  givenName: z.string().min(1, "First name is required"),
  familyName: z.string().nullable().optional(),
  emailAddress: z.string().email("Invalid email").nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  referenceId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(), // YYYY-MM-DD
  creationSource: z.string().nullable().optional(),
  addresses: z.array(addressSchema).optional(),
  defaultAddressIndex: z.number().int().min(0).optional(),
});

const updateCustomerSchema = z.object({
  id: z.string().min(1, "Customer ID is required"),
  givenName: z.string().min(1, "First name is required").optional(),
  familyName: z.string().nullable().optional(),
  emailAddress: z.string().email("Invalid email").nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  referenceId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  creationSource: z.string().nullable().optional(),
  defaultAddressId: z.string().nullable().optional(),
  addresses: z
    .object({
      replace: z.array(addressSchema).optional(),
    })
    .optional(),
});

const addAddressSchema = z.object({
  customerId: z.string().min(1),
  address: addressSchema,
});

const updateAddressSchema = z.object({
  addressId: z.string().min(1),
  address: addressSchema.partial(),
});

// ----------------------------------------------------------------------
// Types for action states
export type CustomerActionState =
  | { status: "idle" }
  | { status: "success"; customerId: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

export type AddressActionState =
  | { status: "idle" }
  | { status: "success"; addressId: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

// ----------------------------------------------------------------------
// Create Customer Action
export async function createCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { status: "error", message: "Invalid form data." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", message: "Could not parse form data." };
  }

  const result = createCustomerSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { addresses, defaultAddressIndex, ...customerData } = result.data;

  try {
    const customer = await createCustomer({
      ...customerData,
      addresses: addresses as CreateAddressInput[] | undefined,
      defaultAddressIndex,
    });

    // revalidatePath("/admin/customers");
    // revalidateTag("customers");
    return { status: "success", customerId: customer.id };
  } catch (error) {
    console.error("Customer creation error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create customer.",
    };
  }
}

// ----------------------------------------------------------------------
// Update Customer Action
export async function updateCustomerAction(
  _prev: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { status: "error", message: "Invalid form data." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", message: "Could not parse form data." };
  }

  const result = updateCustomerSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { id, ...updateData } = result.data;

  try {
    const customer = await updateCustomer(id, updateData);
    // revalidatePath("/admin/customers");
    // revalidatePath(`/admin/customers/${id}`);
    // revalidateTag("customers");
    return { status: "success", customerId: customer.id };
  } catch (error) {
    console.error("Customer update error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update customer.",
    };
  }
}

// ----------------------------------------------------------------------
// Delete Customer Action
export async function deleteCustomerAction(
  customerId: string
): Promise<{ error?: string }> {
  try {
    await deleteCustomer(customerId);
    // revalidatePath("/admin/customers");
    // revalidateTag("customers");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete customer." };
  }
}

// ----------------------------------------------------------------------
// Bulk Delete Customers Action
export async function bulkDeleteCustomersAction(
  customerIds: string[]
): Promise<{ error?: string }> {
  try {
    await bulkDeleteCustomers(customerIds);
    // revalidatePath("/admin/customers");
    // revalidateTag("customers");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to bulk delete customers." };
  }
}

// ----------------------------------------------------------------------
// Address Actions
export async function addAddressAction(
  _prev: AddressActionState,
  formData: FormData
): Promise<AddressActionState> {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { status: "error", message: "Invalid form data." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", message: "Could not parse form data." };
  }

  const result = addAddressSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { customerId, address } = result.data;

  try {
    const newAddress = await addAddressToCustomer(customerId, address as CreateAddressInput);
    // revalidatePath(`/admin/customers/${customerId}`);
    // revalidateTag("customers");
    return { status: "success", addressId: newAddress.id };
  } catch (error) {
    console.error("Add address error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to add address.",
    };
  }
}

export async function updateAddressAction(
  _prev: AddressActionState,
  formData: FormData
): Promise<AddressActionState> {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    return { status: "error", message: "Invalid form data." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", message: "Could not parse form data." };
  }

  const result = updateAddressSchema.safeParse(parsed);
  if (!result.success) {
    return {
      status: "error",
      message: "Validation failed. Please check the form.",
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { addressId, address } = result.data;

  try {
    const updatedAddress = await updateAddress(addressId, address);
    // Since address belongs to a customer, revalidate that customer's page
    // We might need to fetch the customerId from the address; lib function could return it.
    // For simplicity, revalidate customers list and tag.
    // revalidatePath("/admin/customers");
    // revalidateTag("customers");
    return { status: "success", addressId: updatedAddress.id };
  } catch (error) {
    console.error("Update address error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update address.",
    };
  }
}

export async function deleteAddressAction(
  addressId: string
): Promise<{ error?: string }> {
  try {
    await deleteAddress(addressId);
    // revalidatePath("/admin/customers");
    // revalidateTag("customers");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete address." };
  }
}

export async function setDefaultAddressAction(
  customerId: string,
  addressId: string
): Promise<{ error?: string }> {
  try {
    await setDefaultAddress(customerId, addressId);
    // revalidatePath(`/admin/customers/${customerId}`);
    // revalidateTag("customers");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to set default address." };
  }
}

// ----------------------------------------------------------------------
// Utility to revalidate customers (if needed elsewhere)
const CUSTOMERS_PATH = "/admin/customers";
const CUSTOMERS_TAG = "customers";

function invalidateCustomers() {
  // revalidatePath(CUSTOMERS_PATH);
  // revalidateTag(CUSTOMERS_TAG);
}



