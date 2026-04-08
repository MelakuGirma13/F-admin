import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerEmail: string;
  createdAt: Date;
  orderItems: {
    product_name: string;
    product_image: string | null;
    quantity: number;
    price: number;
    variant_details?: string; 
  }[];
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
}

export const OrderConfirmationEmail = ({
  orderNumber = "ORD-7721",
  customerEmail = "customer@example.com",
  createdAt = new Date(),
  orderItems = [],
  totals = { subtotal: 0, tax: 0, shipping: 0, total: 0 },
}: OrderConfirmationEmailProps) => {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(createdAt);

  return (
    <Html>
      <Head />
      <Preview>Your order confirmation: {orderNumber}</Preview>
      <Tailwind>
        <Body className="bg-zinc-50 font-sans py-12 px-2">
          <Container className="max-w-[600px] mx-auto bg-white border border-zinc-200 rounded-lg overflow-hidden">
            {/* Brand Header */}
            <Section className="px-10 py-8 bg-zinc-900 text-center">
              <Heading className="text-white text-2xl font-bold m-0 uppercase tracking-tighter">
                Your Store
              </Heading>
            </Section>

            <Section className="px-10 pt-8">
              <Heading className="text-zinc-900 text-2xl font-semibold m-0">
                Thanks for your order!
              </Heading>
              <Text className="text-zinc-500 text-sm mt-2">
                We’ve received your order and we’re getting it ready for you. We’ll notify you when it ships.
              </Text>
            </Section>

            {/* Order Meta Detail */}
            <Section className="px-10 py-4">
              <Row className="border-y border-zinc-100 py-4">
                <Column>
                  <Text className="text-zinc-400 text-xs uppercase font-bold m-0">Order Number</Text>
                  <Text className="text-zinc-900 text-sm font-medium m-0">{orderNumber}</Text>
                </Column>
                <Column>
                  <Text className="text-zinc-400 text-xs uppercase font-bold m-0">Date Placed</Text>
                  <Text className="text-zinc-900 text-sm font-medium m-0">{formattedDate}</Text>
                </Column>
              </Row>
            </Section>

            {/* Order Items List */}
            <Section className="px-10 py-4">
              <Text className="text-zinc-900 font-semibold mb-4">Summary</Text>
              {orderItems.map((item, index) => (
                <Row key={index} className="mb-6">
                  <Column className="w-[64px] pr-4 align-top">
                    <Img
                      src={item.product_image || "https://yourstore.com/placeholder.png"}
                      width="64"
                      height="64"
                      className="rounded-md border border-zinc-200 object-cover"
                    />
                  </Column>
                  <Column className="align-top">
                    <Text className="text-zinc-900 text-sm font-medium m-0 leading-tight">
                      {item.product_name}
                    </Text>
                    {item.variant_details && (
                      <Text className="text-zinc-500 text-xs m-0 mt-1 italic">
                        {item.variant_details}
                      </Text>
                    )}
                    <Text className="text-zinc-500 text-xs m-0 mt-1">
                      Qty: {item.quantity}
                    </Text>
                  </Column>
                  <Column className="text-right align-top">
                    <Text className="text-zinc-900 text-sm font-semibold m-0">
                      ${item.price.toFixed(2)}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr className="border-zinc-200 mx-10" />

            {/* Financial Breakdown */}
            <Section className="px-10 py-6">
              <Row className="mb-2">
                <Column><Text className="text-zinc-500 text-sm m-0">Subtotal</Text></Column>
                <Column className="text-right"><Text className="text-zinc-900 text-sm m-0 font-medium">${totals.subtotal.toFixed(2)}</Text></Column>
              </Row>
              <Row className="mb-2">
                <Column><Text className="text-zinc-500 text-sm m-0">Shipping</Text></Column>
                <Column className="text-right"><Text className="text-zinc-900 text-sm m-0 font-medium">${totals.shipping.toFixed(2)}</Text></Column>
              </Row>
              <Row className="mb-2">
                <Column><Text className="text-zinc-500 text-sm m-0">Estimated Tax</Text></Column>
                <Column className="text-right"><Text className="text-zinc-900 text-sm m-0 font-medium">${totals.tax.toFixed(2)}</Text></Column>
              </Row>
              <Row className="mt-4">
                <Column><Text className="text-zinc-900 text-base font-bold m-0">Total</Text></Column>
                <Column className="text-right">
                  <Text className="text-zinc-900 text-xl font-bold m-0">${totals.total.toFixed(2)}</Text>
                </Column>
              </Row>
            </Section>

            {/* Footer / Support */}
            <Section className="px-10 py-8 bg-zinc-50 border-t border-zinc-200 text-center">
              <Text className="text-zinc-500 text-xs m-0">
                Questions? Visit our <Link href="#" className="text-zinc-900 underline">Help Center</Link> or reply to this email.
              </Text>
              <Text className="text-zinc-400 text-[10px] mt-4 uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Your Store Inc. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrderConfirmationEmail;