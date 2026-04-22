/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma, Customer, Address } from "@prisma/client";
import db from "./db";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Prisma include object for a complete customer with addresses
const customerInclude = {
  addresses: true,
  defaultAddress: true,
} as const;

// Type for a customer with all relations included
export type CustomerWithRelations = Prisma.CustomerGetPayload<{
  include: typeof customerInclude;
}>;

// Domain filter params (used by getCustomers)
export interface CustomerFilterParams {
  page: number;
  pageSize: number;
  sortField: string;
  sortDir: "asc" | "desc";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Paginated response
export interface PaginatedCustomers {
  customers: CustomerWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// DATA ACCESS LAYER
// ============================================================================

/**
 * Fetch a single customer by ID including addresses.
 */
export async function getCustomerById(id: string): Promise<CustomerWithRelations> {
  const customer = await db.customer.findUnique({
    where: { id },
    include: customerInclude,
  });

  if (!customer) {
    throw new Error(`Customer not found`);
  }
  return JSON.parse(JSON.stringify(customer));
}

/**
 * Fetch paginated, filtered, sorted list of customers.
 */
export async function getCustomers(
  params: CustomerFilterParams
): Promise<PaginatedCustomers> {
  const {
    page,
    pageSize,
    sortField,
    sortDir,
    search,
    dateFrom,
    dateTo,
  } = params;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: Prisma.CustomerWhereInput = {};

  // Date range filter
  if (dateFrom) {
    where.createdAt = { gte: new Date(dateFrom) };
  }
  if (dateTo) {
    const nextDay = new Date(dateTo);
    nextDay.setDate(nextDay.getDate() + 1);
    where.createdAt = {
      ...(typeof where.createdAt === "object" ? where.createdAt : {}),
      lt: nextDay,
    };
  }

  // Search filter (name, email, phone)
  if (search) {
    where.OR = [
      { givenName: { contains: search, mode: "insensitive" } },
      { familyName: { contains: search, mode: "insensitive" } },
      { emailAddress: { contains: search, mode: "insensitive" } },
      { phoneNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  // Sorting mapping
  const fieldMap: Record<string, string> = {
    givenName: "givenName",
    familyName: "familyName",
    emailAddress: "emailAddress",
    phoneNumber: "phoneNumber",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  };
  const orderByField = fieldMap[sortField] || "createdAt";
  const orderBy: Prisma.CustomerOrderByWithRelationInput = {
    [orderByField]: sortDir === "asc" ? "asc" : "desc",
  };

  const [total, customersData] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      skip,
      take,
      orderBy,
      include: customerInclude,
    }),
  ]);

  return {
    customers: JSON.parse(JSON.stringify(customersData)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Delete a single customer.
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  await db.customer.delete({
    where: { id: customerId },
  });
}

// ============================================================================
// BULK ACTIONS
// ============================================================================

export async function bulkDeleteCustomers(customerIds: string[]): Promise<void> {
  await db.customer.deleteMany({
    where: { id: { in: customerIds } },
  });
}

// ============================================================================
// COUNT HELPERS
// ============================================================================

export interface CustomerCounts {
  total: number;
  withEmail: number;
  withPhone: number;
}

export async function getCustomerCounts(): Promise<CustomerCounts> {
  const [total, withEmail, withPhone] = await Promise.all([
    db.customer.count(),
    db.customer.count({ where: { emailAddress: { not: null } } }),
    db.customer.count({ where: { phoneNumber: { not: null } } }),
  ]);
  return { total, withEmail, withPhone };
}

// ============================================================================
// CREATE CUSTOMER
// ============================================================================

export interface CreateCustomerInput {
  givenName: string;
  familyName?: string | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  companyName?: string | null;
  referenceId?: string | null;
  note?: string | null;
  birthday?: string | null; // "YYYY-MM-DD"
  creationSource?: string | null;
  addresses?: CreateAddressInput[];
  defaultAddressIndex?: number; // index in addresses array to set as default
}

export interface CreateAddressInput {
  addressType?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  organization?: string | null;
  phoneNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  locality?: string | null;
  administrativeDistrictLevel1?: string | null;
  sublocality?: string | null;
  postalCode?: string | null;
  country?: string | null;
  squareAddressId?: string | null;
}

export async function createCustomer(
  input: CreateCustomerInput
): Promise<CustomerWithRelations> {
  const { addresses, defaultAddressIndex, ...customerData } = input;

  // Prepare addresses creation data
  const addressesCreate: Prisma.AddressCreateWithoutCustomerInput[] =
    addresses?.map((addr) => ({
      addressType: addr.addressType,
      firstName: addr.firstName,
      lastName: addr.lastName,
      organization: addr.organization,
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      locality: addr.locality,
      administrativeDistrictLevel1: addr.administrativeDistrictLevel1,
      sublocality: addr.sublocality,
      postalCode: addr.postalCode,
      country: addr.country,
      squareAddressId: addr.squareAddressId,
    })) ?? [];

  // Determine default address connection
  // let defaultAddressConnect: { id: string } | undefined = undefined;
  // if (addressesCreate.length > 0 && defaultAddressIndex !== undefined) {
  //   // Cannot connect by index directly in creation; we'll handle after creation
  //   // Or use a nested create with a temporary ID approach.
  //   // Simpler: create customer with addresses, then update defaultAddressId.
  // }

  const newCustomer = await db.customer.create({
    data: {
      givenName: customerData.givenName,
      familyName: customerData.familyName,
      emailAddress: customerData.emailAddress,
      phoneNumber: customerData.phoneNumber,
      companyName: customerData.companyName,
      referenceId: customerData.referenceId,
      note: customerData.note,
      birthday: customerData.birthday,
      creationSource: customerData.creationSource,
      addresses: {
        create: addressesCreate,
      },
    },
    include: customerInclude,
  });

  // If default address specified, update the customer to set defaultAddressId
  if (
    addressesCreate.length > 0 &&
    defaultAddressIndex !== undefined &&
    defaultAddressIndex >= 0 &&
    defaultAddressIndex < newCustomer.addresses.length
  ) {
    const defaultAddrId = newCustomer.addresses[defaultAddressIndex].id;
    await db.customer.update({
      where: { id: newCustomer.id },
      data: { defaultAddressId: defaultAddrId },
    });
    // Fetch again to include updated relation
    return await getCustomerById(newCustomer.id);
  }

  return newCustomer;
}

// ============================================================================
// UPDATE CUSTOMER
// ============================================================================

export interface UpdateCustomerInput {
  givenName?: string;
  familyName?: string | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  companyName?: string | null;
  referenceId?: string | null;
  note?: string | null;
  birthday?: string | null;
  creationSource?: string | null;
  defaultAddressId?: string | null;
  addresses?: {
    // If we want to replace all addresses (delete and create)
    replace?: CreateAddressInput[];
    // Or update individual addresses by ID (not implemented here for brevity)
  };
}

export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput
): Promise<CustomerWithRelations> {
  const updateData: Prisma.CustomerUpdateInput = {};

  if (input.givenName !== undefined) updateData.givenName = input.givenName;
  if (input.familyName !== undefined) updateData.familyName = input.familyName;
  if (input.emailAddress !== undefined) updateData.emailAddress = input.emailAddress;
  if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber;
  if (input.companyName !== undefined) updateData.companyName = input.companyName;
  if (input.referenceId !== undefined) updateData.referenceId = input.referenceId;
  if (input.note !== undefined) updateData.note = input.note;
  if (input.birthday !== undefined) updateData.birthday = input.birthday;
  if (input.creationSource !== undefined) updateData.creationSource = input.creationSource;
  if (input.defaultAddressId !== undefined) {
    updateData.defaultAddress = input.defaultAddressId
      ? { connect: { id: input.defaultAddressId } }
      : { disconnect: true };
  }

  // Handle address replacement if provided
  if (input.addresses?.replace) {
    updateData.addresses = {
      deleteMany: {},
      create: input.addresses.replace.map((addr) => ({
        addressType: addr.addressType,
        firstName: addr.firstName,
        lastName: addr.lastName,
        organization: addr.organization,
        phoneNumber: addr.phoneNumber,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2,
        locality: addr.locality,
        administrativeDistrictLevel1: addr.administrativeDistrictLevel1,
        sublocality: addr.sublocality,
        postalCode: addr.postalCode,
        country: addr.country,
        squareAddressId: addr.squareAddressId,
      })),
    };
  }

  const updatedCustomer = await db.customer.update({
    where: { id: customerId },
    data: updateData,
    include: customerInclude,
  });

  return updatedCustomer;
}

// ============================================================================
// ADDRESS OPERATIONS
// ============================================================================

export async function addAddressToCustomer(
  customerId: string,
  addressInput: CreateAddressInput
): Promise<Address> {
  return await db.address.create({
    data: {
      ...addressInput,
      customer: { connect: { id: customerId } },
    },
  });
}

export async function updateAddress(
  addressId: string,
  input: Partial<CreateAddressInput>
): Promise<Address> {
  return await db.address.update({
    where: { id: addressId },
    data: input,
  });
}

export async function deleteAddress(addressId: string): Promise<void> {
  await db.address.delete({
    where: { id: addressId },
  });
}

export async function setDefaultAddress(
  customerId: string,
  addressId: string
): Promise<Customer> {
  // Verify address belongs to customer
  const address = await db.address.findFirst({
    where: { id: addressId, customerId },
  });
  if (!address) {
    throw new Error("Address not found or does not belong to this customer.");
  }
  return await db.customer.update({
    where: { id: customerId },
    data: { defaultAddressId: addressId },
  });
}


export async function getCustomerBySquareId(
  squareId: string
): Promise<CustomerWithRelations | null> {
  const customer = await db.customer.findUnique({
    where: { squareId },
    include: customerInclude,
  });
  return customer ? JSON.parse(JSON.stringify(customer)) : null;
}

export async function getCustomerByEmail(
  email: string
): Promise<CustomerWithRelations | null> {
  const customer = await db.customer.findFirst({
    where: { emailAddress: { equals: email, mode: "insensitive" } },
    include: customerInclude,
  });
  return customer ? JSON.parse(JSON.stringify(customer)) : null;
}

export async function getCustomerByPhone(
  phone: string
): Promise<CustomerWithRelations | null> {
  const customer = await db.customer.findFirst({
    where: { phoneNumber: phone },
    include: customerInclude,
  });
  return customer ? JSON.parse(JSON.stringify(customer)) : null;
}