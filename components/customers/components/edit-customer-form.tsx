/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useActionState, useState, useEffect, useCallback } from "react";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  UserCheck,
  X,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  updateCustomerAction,
  type CustomerActionState,
} from "@/app/actions/customers/customers";

// ----------------------------------------------------------------------
// Types
interface Address {
  id: string;
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
}

interface Customer {
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
  birthday?: string | null;
  creationSource?: string | null;
  version?: number | null;
  preferences?: any;
  groupIds?: string[];
  segmentIds?: string[];
  defaultAddressId?: string | null;
  defaultAddress?: Address | null;
  addresses?: Address[];
}

// ----------------------------------------------------------------------
// Draft address type for internal form state
interface DraftAddress {
  id: string;
  existingId?: string; // original DB id
  addressType?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  administrativeDistrictLevel1?: string;
  sublocality?: string;
  postalCode?: string;
  country?: string;
}

// ----------------------------------------------------------------------
// Constants
const ADDRESS_TYPES = [
  { value: "SHIPPING", label: "Shipping" },
  { value: "BILLING", label: "Billing" },
  { value: "BOTH", label: "Both" },
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

// ----------------------------------------------------------------------
// CustomerAddresses Component (Edit version)
interface CustomerAddressesProps {
  addresses: DraftAddress[];
  onChange?: (addresses: DraftAddress[]) => void;
  defaultAddressId?: string;
  onDefaultChange?: (id: string) => void;
  title?: string;
  disabled?: boolean;
}

const CustomerAddresses: React.FC<CustomerAddressesProps> = ({
  addresses,
  onChange,
  defaultAddressId,
  onDefaultChange,
  title = "Addresses",
  disabled = false,
}) => {
  const tempId = () => Math.random().toString(36).substring(2, 9);

  const addAddress = () => {
    const newAddress: DraftAddress = {
      id: tempId(),
      addressType: "SHIPPING",
    };
    onChange?.([...addresses, newAddress]);
  };

  const updateAddress = (id: string, field: keyof DraftAddress, value: string) => {
    const updated = addresses.map((addr) =>
      addr.id === id ? { ...addr, [field]: value || undefined } : addr
    );
    onChange?.(updated);
  };

  const removeAddress = (id: string) => {
    const updated = addresses.filter((addr) => addr.id !== id);
    onChange?.(updated);
    if (defaultAddressId === id && onDefaultChange) {
      onDefaultChange("");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAddress}
          disabled={disabled}
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Address
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {addresses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No addresses added. Click "Add Address" to create one.
          </p>
        )}
        {addresses.map((addr, index) => (
          <div key={addr.id} className="p-3 border rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Address {index + 1}</span>
                {defaultAddressId === addr.id && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onDefaultChange && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onDefaultChange(addr.id)}
                    disabled={disabled || defaultAddressId === addr.id}
                  >
                    Set as Default
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeAddress(addr.id)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Address Type</Label>
                <Select
                  value={addr.addressType || "SHIPPING"}
                  onValueChange={(v) => updateAddress(addr.id, "addressType", v)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  value={addr.phoneNumber || ""}
                  onChange={(e) =>
                    updateAddress(addr.id, "phoneNumber", e.target.value)
                  }
                  placeholder="(123) 456-7890"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">First Name</Label>
                <Input
                  value={addr.firstName || ""}
                  onChange={(e) =>
                    updateAddress(addr.id, "firstName", e.target.value)
                  }
                  placeholder="John"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label className="text-xs">Last Name</Label>
                <Input
                  value={addr.lastName || ""}
                  onChange={(e) =>
                    updateAddress(addr.id, "lastName", e.target.value)
                  }
                  placeholder="Doe"
                  disabled={disabled}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Organization (Optional)</Label>
              <Input
                value={addr.organization || ""}
                onChange={(e) =>
                  updateAddress(addr.id, "organization", e.target.value)
                }
                placeholder="Company Inc."
                disabled={disabled}
              />
            </div>

            <div>
              <Label className="text-xs">Address Line 1</Label>
              <Input
                value={addr.addressLine1 || ""}
                onChange={(e) =>
                  updateAddress(addr.id, "addressLine1", e.target.value)
                }
                placeholder="123 Main St"
                disabled={disabled}
              />
            </div>

            <div>
              <Label className="text-xs">Address Line 2 (Optional)</Label>
              <Input
                value={addr.addressLine2 || ""}
                onChange={(e) =>
                  updateAddress(addr.id, "addressLine2", e.target.value)
                }
                placeholder="Apt 4B"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">City</Label>
                <Input
                  value={addr.locality || ""}
                  onChange={(e) =>
                    updateAddress(addr.id, "locality", e.target.value)
                  }
                  placeholder="New York"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label className="text-xs">State/Province</Label>
                <Input
                  value={addr.administrativeDistrictLevel1 || ""}
                  onChange={(e) =>
                    updateAddress(
                      addr.id,
                      "administrativeDistrictLevel1",
                      e.target.value
                    )
                  }
                  placeholder="NY"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label className="text-xs">Postal Code</Label>
                <Input
                  value={addr.postalCode || ""}
                  onChange={(e) =>
                    updateAddress(addr.id, "postalCode", e.target.value)
                  }
                  placeholder="10001"
                  disabled={disabled}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Country</Label>
              <Select
                value={addr.country || "US"}
                onValueChange={(v) => updateAddress(addr.id, "country", v)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ----------------------------------------------------------------------
// Main EditCustomerForm component
interface EditCustomerFormProps {
  customer: Customer;
}

export function EditCustomerForm({ customer }: EditCustomerFormProps) {
  const initialState: CustomerActionState = { status: "idle" };
  const [state, formAction, isPending] = useActionState(
    updateCustomerAction,
    initialState
  );

  // Basic info
  const [givenName, setGivenName] = useState(customer.givenName);
  const [familyName, setFamilyName] = useState(customer.familyName || "");
  const [emailAddress, setEmailAddress] = useState(customer.emailAddress || "");
  const [phoneNumber, setPhoneNumber] = useState(customer.phoneNumber || "");
  const [companyName, setCompanyName] = useState(customer.companyName || "");
  const [referenceId, setReferenceId] = useState(customer.referenceId || "");
  const [note, setNote] = useState(customer.note || "");
  const [birthday, setBirthday] = useState(
    customer.birthday ? new Date(customer.birthday).toISOString().split("T")[0] : ""
  );
  const [creationSource, setCreationSource] = useState(customer.creationSource || "MANUAL");

  // Addresses
  const [addresses, setAddresses] = useState<DraftAddress[]>(
    (customer.addresses || []).map((addr) => ({
      id: addr.id,
      existingId: addr.id,
      addressType: addr.addressType || "SHIPPING",
      firstName: addr.firstName || "",
      lastName: addr.lastName || "",
      organization: addr.organization || "",
      phoneNumber: addr.phoneNumber || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      locality: addr.locality || "",
      administrativeDistrictLevel1: addr.administrativeDistrictLevel1 || "",
      sublocality: addr.sublocality || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "US",
    }))
  );
  const [defaultAddressId, setDefaultAddressId] = useState<string>(
    customer.defaultAddressId || ""
  );

  // Validation
  const isValid = givenName.trim() !== "";

  // --------------------------------------------------------------------
  // Submit handler – builds payload matching server action expectations
  const handleSubmit = (formData: FormData) => {
    const payload = {
      id: customer.id,
      givenName: givenName.trim(),
      familyName: familyName.trim() || null,
      emailAddress: emailAddress.trim() || null,
      phoneNumber: phoneNumber.trim() || null,
      companyName: companyName.trim() || null,
      referenceId: referenceId.trim() || null,
      note: note.trim() || null,
      birthday: birthday || null,
      creationSource: creationSource || null,
      defaultAddressId: defaultAddressId || null,
      addresses: {
        replace: addresses.map((addr) => ({
          id: addr.existingId, // will be undefined for new addresses
          addressType: addr.addressType,
          firstName: addr.firstName || null,
          lastName: addr.lastName || null,
          organization: addr.organization || null,
          phoneNumber: addr.phoneNumber || null,
          addressLine1: addr.addressLine1 || null,
          addressLine2: addr.addressLine2 || null,
          locality: addr.locality || null,
          administrativeDistrictLevel1: addr.administrativeDistrictLevel1 || null,
          sublocality: addr.sublocality || null,
          postalCode: addr.postalCode || null,
          country: addr.country || null,
        })),
      },
    };

    formData.set("payload", JSON.stringify(payload));
    formAction(formData);
  };

  const fullName = [givenName, familyName].filter(Boolean).join(" ") || "—";

  return (
    <form action={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/admin/customers">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to customers</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold leading-none">
              Edit Customer
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Update customer profile and address information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/customers">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={isPending}
            >
              Cancel
            </Button>
          </Link>
          <Button size="sm" type="submit" disabled={isPending || !isValid}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Update Customer
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          {state.status === "error" && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          {state.status === "success" && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>Customer updated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="givenName">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="givenName"
                        value={givenName}
                        onChange={(e) => setGivenName(e.target.value)}
                        placeholder="John"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="familyName">Last Name</Label>
                      <Input
                        id="familyName"
                        value={familyName}
                        onChange={(e) => setFamilyName(e.target.value)}
                        placeholder="Doe"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="emailAddress">Email Address</Label>
                      <Input
                        id="emailAddress"
                        type="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="john.doe@example.com"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="(123) 456-7890"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="companyName">Company (Optional)</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Company Inc."
                      disabled={isPending}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="birthday">Birthday</Label>
                      <Input
                        id="birthday"
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="referenceId">Reference ID (Optional)</Label>
                      <Input
                        id="referenceId"
                        value={referenceId}
                        onChange={(e) => setReferenceId(e.target.value)}
                        placeholder="External reference"
                        disabled={isPending}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="note">Notes (Optional)</Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Additional notes about this customer..."
                      rows={3}
                      disabled={isPending}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="creationSource">Source</Label>
                    <Input
                      id="creationSource"
                      value={creationSource}
                      onChange={(e) => setCreationSource(e.target.value)}
                      placeholder="MANUAL"
                      disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                      How this customer was created (e.g., MANUAL, IMPORT, API)
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses */}
              <CustomerAddresses
                addresses={addresses}
                onChange={setAddresses}
                defaultAddressId={defaultAddressId}
                onDefaultChange={setDefaultAddressId}
                disabled={isPending}
              />
            </div>

            {/* Right sidebar - summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium truncate max-w-[180px]">
                      {fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="truncate max-w-[180px]">
                      {emailAddress || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{phoneNumber || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company</span>
                    <span className="truncate max-w-[180px]">
                      {companyName || "—"}
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Addresses</span>
                    <span>{addresses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Address</span>
                    <span>
                      {defaultAddressId
                        ? `Address ${addresses.findIndex((a) => a.id === defaultAddressId) + 1}`
                        : "—"}
                    </span>
                  </div>
                  {customer.squareId && (
                    <>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Square ID</span>
                        <span className="font-mono text-xs truncate max-w-[180px]">
                          {customer.squareId}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {!isValid && (
                <Alert
                  variant="default"
                  className="text-amber-800 border-amber-200 bg-amber-50"
                >
                  <AlertDescription className="text-xs">
                    First name is required.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}