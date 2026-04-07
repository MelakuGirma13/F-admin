import db from "@/lib/db";


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string } >}
) {
  const {id:id} = await params;
  try {
    const customOrder = await db.customOrder.findFirst({
      where: { id: id },
      include: { measurements: true },
      orderBy: { created_at: "desc" },
    });

    if (!customOrder) {
      return new Response(JSON.stringify(null), { status: 404 });
    }

    return Response.json(customOrder);
  } catch (error) {
    return new Response("Server error", { status: 500 });
  }
}