import { ChartBarLabelCustom } from "@/components/dashboard/bar-cart";
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";
import { DataTable } from "@/components/dashboard/data-table";
import { ChartRadarDefault } from "@/components/dashboard/radar-chart";
import { SectionCards } from "@/components/dashboard/section-cards";
import data from "./data.json";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
export const dynamic = 'force-dynamic';

export default async function Page() {

    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <ChartBarLabelCustom />
            <ChartRadarDefault />
            <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
            </div>
            <DataTable data={data} />
        </div>
    )
}
