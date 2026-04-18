/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  Info,
  Home,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ----------------------------------------------------------------------
// Types (matching the API response from getCustomerById)
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
// Helper functions
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getAddressTypeLabel = (type?: string | null) => {
  const labels: Record<string, string> = {
    SHIPPING: "Shipping",
    BILLING: "Billing",
    BOTH: "Shipping & Billing",
  };
  return labels[type || ""] || type || "Other";
};

const formatAddress = (addr: Address) => {
  const parts = [
    addr.addressLine1,
    addr.addressLine2,
    addr.locality,
    addr.administrativeDistrictLevel1,
    addr.postalCode,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
};

// ----------------------------------------------------------------------
// Main Component
interface CustomerDetailProps {
  customer: Customer;
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const fullName = [customer.givenName, customer.familyName]
    .filter(Boolean)
    .join(" ") || "—";
  const hasContact = customer.emailAddress || customer.phoneNumber;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/customers">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to customers</span>
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-tight">
              Customer Details
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              View customer profile and address information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/customers/${customer.id}/edit`}>
            <Button variant="outline" size="sm" type="button">
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
            </Button>
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Profile Card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Avatar & Basic Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <User className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">{fullName}</h2>
                    {customer.companyName && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {customer.companyName}
                      </p>
                    )}
                    {customer.referenceId && (
                      <Badge variant="outline" className="mt-2">
                        Ref: {customer.referenceId}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {customer.emailAddress && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={`mailto:${customer.emailAddress}`}
                        className="text-sm hover:underline"
                      >
                        {customer.emailAddress}
                      </a>
                    </div>
                  )}
                  {customer.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={`tel:${customer.phoneNumber}`}
                        className="text-sm hover:underline"
                      >
                        {customer.phoneNumber}
                      </a>
                    </div>
                  )}
                  {!hasContact && (
                    <p className="text-sm text-muted-foreground italic">
                      No contact information provided.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Customer since:</span>{" "}
                      <span className="font-medium">
                        {formatDate(customer.createdAt)}
                      </span>
                    </span>
                  </div>
                  {customer.birthday && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Birthday:</span>{" "}
                        <span className="font-medium">
                          {new Date(customer.birthday).toLocaleDateString()}
                        </span>
                      </span>
                    </div>
                  )}
                  {customer.creationSource && (
                    <div className="flex items-center gap-3">
                      <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Source:</span>{" "}
                        <span className="font-medium">
                          {customer.creationSource}
                        </span>
                      </span>
                    </div>
                  )}
                  {customer.squareId && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm">
                        <span className="text-muted-foreground">Square ID:</span>{" "}
                        <span className="font-mono text-xs">{customer.squareId}</span>
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column - Details and Tabs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Notes Card */}
              {customer.note && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Notes
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {customer.note}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tabs for addresses and details */}
              <div className="sticky top-0 z-10 bg-background pt-2 -mx-6 px-6">
                <Tabs defaultValue="addresses" className="w-full">
                  <div className="rounded-lg border bg-card">
                    <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 rounded-t-lg border-b">
                      <TabsTrigger
                        value="addresses"
                        className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-background"
                      >
                        <MapPin className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Addresses</span>
                        <span className="sm:hidden">Addresses</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="details"
                        className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-background"
                      >
                        <Info className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Details</span>
                        <span className="sm:hidden">Details</span>
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-4 sm:p-6">
                      {/* Addresses Tab Content */}
                      <TabsContent value="addresses" className="mt-0">
                        {!customer.addresses || customer.addresses.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-sm text-muted-foreground">
                              No addresses on file for this customer.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Desktop Table */}
                            <div className="hidden sm:block">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[120px]">Type</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead className="text-right">Default</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {customer.addresses.map((addr) => (
                                    <TableRow key={addr.id}>
                                      <TableCell>
                                        <Badge variant="outline">
                                          {getAddressTypeLabel(addr.addressType)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm">
                                          {formatAddress(addr)}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm space-y-0.5">
                                          {addr.firstName || addr.lastName ? (
                                            <div>
                                              {[addr.firstName, addr.lastName]
                                                .filter(Boolean)
                                                .join(" ")}
                                            </div>
                                          ) : null}
                                          {addr.phoneNumber && (
                                            <div className="text-xs text-muted-foreground">
                                              {addr.phoneNumber}
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {customer.defaultAddressId === addr.id ? (
                                          <CheckCircle2 className="h-5 w-5 text-green-600 ml-auto" />
                                        ) : null}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="sm:hidden space-y-3">
                              {customer.addresses.map((addr) => (
                                <div
                                  key={addr.id}
                                  className="border rounded-lg p-4 bg-background"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <Badge variant="outline">
                                      {getAddressTypeLabel(addr.addressType)}
                                    </Badge>
                                    {customer.defaultAddressId === addr.id && (
                                      <Badge
                                        variant="secondary"
                                        className="gap-1"
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm mb-2">{formatAddress(addr)}</p>
                                  {(addr.firstName || addr.lastName || addr.phoneNumber) && (
                                    <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                      {addr.firstName || addr.lastName ? (
                                        <p>
                                          {[addr.firstName, addr.lastName]
                                            .filter(Boolean)
                                            .join(" ")}
                                        </p>
                                      ) : null}
                                      {addr.phoneNumber && <p>{addr.phoneNumber}</p>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* Details Tab Content */}
                      <TabsContent value="details" className="mt-0">
                        <div className="space-y-6 sm:space-y-8">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Customer ID
                              </dt>
                              <dd className="text-sm font-mono bg-muted/30 px-3 py-1.5 rounded border break-all">
                                {customer.id}
                              </dd>
                            </div>
                            <div className="space-y-1">
                              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Last Updated
                              </dt>
                              <dd className="text-sm px-3 py-1.5">
                                {formatDate(customer.updatedAt)}
                              </dd>
                            </div>
                            {customer.version !== null && (
                              <div className="space-y-1">
                                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Version
                                </dt>
                                <dd className="text-sm px-3 py-1.5">
                                  {customer.version}
                                </dd>
                              </div>
                            )}
                            {customer.groupIds && customer.groupIds.length > 0 && (
                              <div className="space-y-1">
                                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Group IDs
                                </dt>
                                <dd className="text-sm px-3 py-1.5 flex flex-wrap gap-1">
                                  {customer.groupIds.map((id) => (
                                    <Badge key={id} variant="outline">
                                      {id}
                                    </Badge>
                                  ))}
                                </dd>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div>
                            <h4 className="text-sm font-medium mb-3">
                              Preferences
                            </h4>
                            {customer.preferences ? (
                              <pre className="text-xs bg-muted/30 p-3 rounded border overflow-auto">
                                {JSON.stringify(customer.preferences, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No preferences set.
                              </p>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  </div>
                </Tabs>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button variant="outline" asChild className="sm:w-auto w-full">
                  <Link href="/admin/customers">Back to Customers</Link>
                </Button>
                <Button asChild className="sm:w-auto w-full">
                  <Link href={`/admin/customers/${customer.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Customer
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}