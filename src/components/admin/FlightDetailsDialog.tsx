import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Calendar, User, MapPin, CreditCard, Clock } from "lucide-react";

interface FlightDetailsDialogProps {
    booking: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function FlightDetailsDialog({ booking, open, onOpenChange }: FlightDetailsDialogProps) {
    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                Flight Booking
                                <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                                    {booking.status}
                                </Badge>
                            </DialogTitle>
                            <p className="text-muted-foreground mt-1">Ref: {booking.booking_reference || booking.pnr || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">${booking.total_price}</p>
                            <p className="text-sm text-muted-foreground">{booking.payment_status}</p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Flight Route */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Plane className="h-4 w-4" /> Flight Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-lg font-semibold">
                                <span>{booking.from_city}</span>
                                <Plane className="h-5 w-5 text-muted-foreground rotate-90" />
                                <span>{booking.to_city}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                                <div>
                                    <p className="text-muted-foreground">Airline</p>
                                    <p className="font-medium">{booking.airline || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Flight No</p>
                                    <p className="font-medium">{booking.flight_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Departure</p>
                                    <p className="font-medium">{new Date(booking.departure_date).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Class</p>
                                    <p className="font-medium capitalize">{booking.class || booking.cabin_class}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <User className="h-4 w-4" /> Passenger Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Adults:</span> <span className="font-medium">{booking.adults}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Children:</span> <span className="font-medium">{booking.children}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span>Total Passengers:</span> <span className="font-bold">{booking.passengers}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" /> Payment Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Base Price:</span> <span className="font-medium">${booking.price_per_person || 0} / person</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Amount:</span> <span className="font-bold text-primary">${booking.total_price}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Status:</span> <span className="capitalize">{booking.payment_status}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
