// types/customers.ts

export interface Address {
  id: string;
  customerId: string;
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

export interface Customer {
  id: string;
  squareId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  givenName: string;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  familyName?: string | null;
  companyName?: string | null;
  referenceId?: string | null;
  note?: string | null;
  birthday?: string | null; // "YYYY-MM-DD"
  creationSource?: string | null;
  version?: number | null;
  //preferences?: any; // Json
  groupIds?: string[];
  segmentIds?: string[];

  // Relations
  defaultAddressId?: string | null;
  defaultAddress?: Address | null;
  addresses?: Address[];
}

// ============================================================================
// SORTING & FILTERING TYPES (for customer list queries)
// ============================================================================

export type SortDir = "asc" | "desc";

export type SortField =
  | "givenName"
  | "familyName"
  | "emailAddress"
  | "phoneNumber"
  | "createdAt"
  | "updatedAt";

export interface CustomerFilterParams {
  page: number;
  pageSize: number;
  sortField: SortField;
  sortDir: SortDir;
  search: string;
  dateFrom: string;
  dateTo: string;
}

export interface PaginatedCustomers {
  customers: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Optional convenience constants for UI filters (if needed)
export const CUSTOMER_SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "givenName", label: "First Name" },
  { value: "familyName", label: "Last Name" },
  { value: "emailAddress", label: "Email" },
  { value: "phoneNumber", label: "Phone" },
  { value: "createdAt", label: "Date Created" },
  { value: "updatedAt", label: "Last Updated" },
];