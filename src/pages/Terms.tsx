import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <Layout>
      <Seo
        title="Terms of Service"
        description="Read our terms of service for using cargo, freight, and air ticket services."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-16 md:py-20">
        <div className="container-wacc">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>Terms & Conditions</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl">
            Please read these terms carefully before using our services
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-wacc max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <div className="bg-card rounded-xl border border-border p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using WACC (Worldwide AirTicketing Cargo & Courier) services, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use our services.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Services Description</h2>
                <p className="text-muted-foreground mb-4">
                  WACC provides cargo, courier, and air ticketing services between Canada and Bangladesh. Our services include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Cargo and parcel shipping</li>
                  <li>Document delivery services</li>
                  <li>Air ticket booking and reservation</li>
                  <li>Door-to-door delivery</li>
                  <li>Package tracking services</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Shipping Terms</h2>
                <p className="text-muted-foreground mb-4">
                  All shipments are subject to the following conditions:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Accurate declaration of package contents is required</li>
                  <li>Prohibited items cannot be shipped (weapons, drugs, hazardous materials)</li>
                  <li>Delivery times are estimates and not guaranteed</li>
                  <li>Customs duties and taxes are the responsibility of the recipient</li>
                  <li>Insurance is optional but recommended for valuable items</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Payment Terms</h2>
                <p className="text-muted-foreground">
                  Payment is due at the time of booking. We accept cash, credit cards, and bank transfers. Prices are quoted in Canadian Dollars (CAD) unless otherwise specified. All prices are subject to change without notice.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Liability</h2>
                <p className="text-muted-foreground">
                  WACC's liability is limited to the declared value of the shipment or the maximum liability as per international shipping regulations, whichever is lower. We are not liable for delays caused by customs, weather, or other circumstances beyond our control.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Air Ticket Booking</h2>
                <p className="text-muted-foreground">
                  Air tickets are subject to airline terms and conditions. Cancellation and modification fees may apply. WACC acts as an agent for airline bookings and is not responsible for airline-related issues such as flight delays, cancellations, or baggage problems.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these terms, please contact us at:
                </p>
                <p className="text-foreground mt-2">
                  <strong>Canada:</strong> +1 437 849 7607<br />
                  <strong>Bangladesh:</strong> +8801715044409<br />
                  <strong>Email:</strong> info@wacclogistics.com
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Last updated: February 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
