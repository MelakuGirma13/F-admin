"use server";
import OrderStatusEmail, { OrderStatusEmailParams } from "@/components/e-mail-templates/order-status-email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = "Resend <onboarding@resend.dev>"


export async function SendOrderStatusEmail({ orderId, orderStatus, customerName }: OrderStatusEmailParams) {
    orderId = "ORD-12345"; // Example logic

    try {
        await resend.emails.send({
            from,
            to: customerName,
            subject: `Order ${orderId}`,
            react: OrderStatusEmail({ orderId, orderStatus, customerName }),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}