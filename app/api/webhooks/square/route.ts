import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  getCustomerBySquareId,
  getCustomerByEmail,
  getCustomerByPhone,
  createCustomer,
  updateCustomer,
  type CreateCustomerInput,
} from "@/lib/customers";

// ----------------------------------------------------------------------
// Helper: Verify Square webhook signature
// ----------------------------------------------------------------------
function isValidSquareSignature(
  rawBody: string,
  signature: string,
  webhookUrl: string,
  signatureKey: string
): boolean {
  const hmac = crypto.createHmac("sha256", signatureKey);
  hmac.update(webhookUrl + rawBody);
  const expectedSignature = hmac.digest("base64");
  return expectedSignature === signature;
}

// ----------------------------------------------------------------------
// POST /api/webhooks/square
// ----------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const headers = request.headers;
    const signature = headers.get("x-square-hmacsha256-signature");

    const webhookUrl = process.env.SQUARE_WEBHOOK_URL!;
    const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;

    // 1. Verify the request is actually from Square
    if (
      !signature ||
      !isValidSquareSignature(rawBody, signature, webhookUrl, signatureKey)
    ) {
      return NextResponse.json(
        { error: "Unauthorized webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type;

    // 2. Handle Customer Events
    if (eventType === "customer.created" || eventType === "customer.updated") {
      // Correct nesting: data.object.customer
      const squareCustomer = payload.data?.object?.customer;

      if (!squareCustomer) {
        console.warn("No customer object found in webhook payload");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const email = squareCustomer.email_address?.toLowerCase() || null;
      const phone = squareCustomer.phone_number || null;
      const squareId = squareCustomer.id;

      // 3. Search for an existing customer using lib functions
      let existingCustomer = null;

      if (squareId) {
        existingCustomer = await getCustomerBySquareId(squareId);
      }
      if (!existingCustomer && email) {
        existingCustomer = await getCustomerByEmail(email);
      }
      if (!existingCustomer && phone) {
        existingCustomer = await getCustomerByPhone(phone);
      }

      if (existingCustomer) {
        // MERGE: Update existing customer
        await updateCustomer(existingCustomer.id, {
          givenName: squareCustomer.given_name || existingCustomer.givenName,
          familyName:
            squareCustomer.family_name !== undefined
              ? squareCustomer.family_name
              : existingCustomer.familyName,
          emailAddress: email,
          phoneNumber: phone,
          companyName: squareCustomer.company_name || existingCustomer.companyName,
          birthday: squareCustomer.birthday || existingCustomer.birthday,
          // Only set squareId if not already present
          ...(existingCustomer.squareId ? {} : { squareId }),
        });
      } else {
        // CREATE: New customer from Square
        const createInput: CreateCustomerInput = {
          givenName: squareCustomer.given_name,
          familyName: squareCustomer.family_name || null,
          emailAddress: email,
          phoneNumber: phone,
          companyName: squareCustomer.company_name || null,
          birthday: squareCustomer.birthday || null,
          creationSource: squareCustomer.creation_source || "SQUARE",
          // Optionally create default address if present
          ...(squareCustomer.address && {
            addresses: [
              {
                addressType: "SHIPPING", // or determine from context
                firstName: squareCustomer.given_name,
                lastName: squareCustomer.family_name,
                addressLine1: squareCustomer.address.address_line_1,
                addressLine2: squareCustomer.address.address_line_2,
                locality: squareCustomer.address.locality,
                administrativeDistrictLevel1:
                  squareCustomer.address.administrative_district_level_1,
                postalCode: squareCustomer.address.postal_code,
                country: squareCustomer.address.country,
              },
            ],
            defaultAddressIndex: 0,
          }),
        };

        await createCustomer(createInput);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Square Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";