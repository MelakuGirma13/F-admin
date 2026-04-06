'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import { Badge } from "../ui/badge"

export interface Measurement {
    id: string
    user_id: string
    name: string
    value: number
    unit: string
    is_required: boolean
    custom_order_data_id: string
}

export function MeasurmentDisplayDialog({ customOrderId }: { customOrderId: string }) {
    const [measurements, setMeasurements] = useState<Measurement[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchCustomOrder = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`/api/custom-orders/${customOrderId}`);
                const orderData = await res.json();

                // If data exists, update the measurements state
                if (orderData && orderData.measurements) {
                    setMeasurements(orderData.measurements);
                }
            } catch (error) {
                console.error("Failed to fetch measurements:", error);
            } finally {
                setIsLoading(false)
            }
        };

        if (customOrderId) {
            fetchCustomOrder();
        }
    }, [customOrderId])

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Badge variant="default">view Measurments</Badge>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Measurements</DialogTitle>
                    <DialogDescription>
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>value</TableHead>
                                <TableHead>Unit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                        Loading measurements...
                                    </TableCell>
                                </TableRow>
                            ) : measurements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                                        No measurements found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                measurements.map((measurement) => (
                                    <TableRow key={measurement.id}>
                                        <TableCell className="font-medium capitalize">
                                            {measurement.name.replace(/_/g, ' ')}
                                        </TableCell>
                                        <TableCell>{measurement.value}</TableCell>
                                        <TableCell>{measurement.unit}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}