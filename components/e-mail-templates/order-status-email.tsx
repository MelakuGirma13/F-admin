import { OrderStatus } from "@/types/orders";
import {
  Html,
  Head,
  Preview,
  Tailwind,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Link,
  Hr,
} from "@react-email/components";

export interface OrderStatusEmailParams {
  orderId: string;
  orderStatus: OrderStatus;
  customerName: string;
}

const statusContent: Record<OrderStatus, { title: string; message: string; color: string }> = {
  PENDING: {
    title: "Action Required: Payment Pending",
    message: "We've saved your order, but we are still waiting on payment to proceed.",
    color: "text-amber-600",
  },
  ORDER_PLACED: {
    title: "We've received your order!",
    message: "Thank you for your purchase. We are getting your order ready to be processed.",
    color: "text-zinc-900",
  },
  PROCESSING: {
    title: "Your order is being processed.",
    message: "Great news! We are currently processing your order.",
    color: "text-blue-600",
  },
  DISPATCHED: {
    title: "Your order is on the way! 🚚",
    message: "Your package has been handed over to our shipping partner and is en route.",
    color: "text-indigo-600",
  },
  COMPLETED: {
    title: "Your order has been delivered.",
    message: "Your package has arrived! We hope you love your new items.",
    color: "text-emerald-600",
  },
  CANCELLED: {
    title: "Your order has been cancelled.",
    message: "As requested, or due to an issue, your order has been cancelled. Any charges will be refunded.",
    color: "text-red-600",
  },
};

export default function OrderStatusEmail({
  orderId,
  orderStatus,
  customerName,
}: OrderStatusEmailParams) {
  const content = statusContent[orderStatus];

  return (
    <Html>
      <Head />
      <Preview>{content.title} - Order #{orderId}</Preview>
      <Tailwind>
        <Body className="bg-zinc-50 font-sans my-auto mx-auto px-2 py-10">
          <Container className="border border-zinc-200 rounded-lg bg-white mt-[40px] mx-auto p-[40px] max-w-[600px]">

            {/* Header Section */}
            <Section className="mt-[32px]">
              <Heading className={`${content.color} text-[24px] font-semibold text-center p-0 my-[30px] mx-0`}>
                {content.title}
              </Heading>
              <Text className="text-zinc-700 text-[16px] leading-[24px]">
                Hi {customerName},
              </Text>
              <Text className="text-zinc-700 text-[16px] leading-[24px]">
                {content.message}
              </Text>
            </Section>

            {/* Order Details Section */}
            <Section className="bg-zinc-50 rounded-md border border-zinc-200 p-6 my-6">
              <Text className="text-zinc-500 text-[14px] uppercase tracking-wider font-semibold m-0 mb-2">
                Order Reference
              </Text>
              <Text className="text-zinc-900 text-[18px] font-mono font-medium m-0">
                {orderId}
              </Text>
            </Section>

            {/* Action Section */}
            <Section className="text-center mt-[32px] mb-[32px]">
              <Link
                href={`${process.env.NEXT_PUBLIC_URL}/order/${orderId}`}
                className="bg-zinc-900 rounded-md text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
              >
                View Order Status
              </Link>
            </Section>

            <Hr className="border border-zinc-200 my-[26px] mx-0 w-full" />

            {/* Footer Section */}
            <Text className="text-zinc-500 text-[12px] leading-[24px]">
              If you have any questions, simply reply to this email or reach out to our support team.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}