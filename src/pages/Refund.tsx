import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function Refund() {
  return (
    <Layout>
      <Seo
        title="Refund Policy"
        description="Understand our refund policies for shipments and bookings."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-16 md:py-20">
        <div className="container-wacc">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>Refund Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund Policy</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl">
            Understand our refund and cancellation policies for all services
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-wacc max-w-4xl">
          <div className="space-y-8">
            {/* Cargo & Courier Refunds */}
            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                📦 Cargo & Courier Services
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Full Refund</p>
                    <p className="text-sm text-muted-foreground">Cancellation before package pickup - 100% refund</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Partial Refund</p>
                    <p className="text-sm text-muted-foreground">Cancellation after pickup but before shipping - 75% refund (25% processing fee)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">No Refund</p>
                    <p className="text-sm text-muted-foreground">Once package is shipped, no refund is available</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> If your package is lost or damaged during transit, you are eligible for compensation based on the declared value and insurance coverage.
                </p>
              </div>
            </div>

            {/* Air Ticket Refunds */}
            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                ✈️ Air Ticket Booking
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Free Cancellation</p>
                    <p className="text-sm text-muted-foreground">Within 24 hours of booking (if departure is more than 7 days away)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Airline Cancellation Fee</p>
                    <p className="text-sm text-muted-foreground">After 24 hours - subject to airline's cancellation policy (fees vary by airline)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Service Fee</p>
                    <p className="text-sm text-muted-foreground">WACC service fee ($25 CAD) is non-refundable after 24 hours</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Refund amounts depend on the airline's policy and fare type purchased. Non-refundable tickets may only receive credit for future travel.
                </p>
              </div>
            </div>

            {/* How to Request Refund */}
            <div className="bg-card rounded-xl border border-border p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">How to Request a Refund</h2>

              <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Contact Us:</strong> Call or email our customer service team with your booking reference number
                </li>
                <li>
                  <strong className="text-foreground">Submit Request:</strong> Provide the reason for cancellation and any supporting documents
                </li>
                <li>
                  <strong className="text-foreground">Processing:</strong> Refund requests are processed within 5-7 business days
                </li>
                <li>
                  <strong className="text-foreground">Receive Refund:</strong> Approved refunds are credited to the original payment method within 10-14 business days
                </li>
              </ol>

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 p-4 bg-primary/10 rounded-lg">
                  <p className="font-medium text-foreground mb-1">🇨🇦 Canada</p>
                  <p className="text-sm text-muted-foreground">+1 437 849 7607</p>
                </div>
                <div className="flex-1 p-4 bg-primary/10 rounded-lg">
                  <p className="font-medium text-foreground mb-1">🇧🇩 Bangladesh</p>
                  <p className="text-sm text-muted-foreground">+8801715044409</p>
                </div>
                <div className="flex-1 p-4 bg-primary/10 rounded-lg">
                  <p className="font-medium text-foreground mb-1">📧 Email</p>
                  <p className="text-sm text-muted-foreground">refunds@wacclogistics.com</p>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Last updated: February 2026
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
