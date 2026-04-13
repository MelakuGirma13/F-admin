import db from "@/lib/db";


export async function GET(
  req: Request,
  
) {
  
  try {
    const categories = await db.productCategory.findMany({
    });

    if (!categories) {
      return new Response(JSON.stringify(null), { status: 404 });
    }

    return Response.json(categories);
  } catch (error) {
    return new Response("Server error", { status: 500 });
  }
}