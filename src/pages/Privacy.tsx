import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <Layout>
      <Seo
        title="Privacy Policy"
        description="Read the Privacy Policy of Wing Way Connect to understand how we handle your data."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-16 md:py-20">
        <div className="container-wacc">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>Privacy Policy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl">
            Your privacy is important to us. Learn how we collect and protect your information
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container-wacc max-w-4xl">
          <div className="prose prose-lg max-w-none">
            <div className="bg-card rounded-xl border border-border p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
                <p className="text-muted-foreground mb-4">
                  We collect information you provide directly to us, such as when you:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Create a shipment or booking</li>
                  <li>Request a quote</li>
                  <li>Contact our customer service</li>
                  <li>Sign up for our newsletter</li>
                  <li>Use our tracking services</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Types of Personal Information</h2>
                <p className="text-muted-foreground mb-4">
                  The personal information we collect may include:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Name and contact information</li>
                  <li>Shipping and billing addresses</li>
                  <li>Phone numbers and email addresses</li>
                  <li>Payment information</li>
                  <li>Passport details (for air ticket bookings)</li>
                  <li>Package contents descriptions</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Process and deliver your shipments</li>
                  <li>Book and manage air tickets</li>
                  <li>Communicate with you about your orders</li>
                  <li>Provide customer support</li>
                  <li>Send tracking updates and notifications</li>
                  <li>Comply with legal requirements</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Information Sharing</h2>
                <p className="text-muted-foreground">
                  We may share your information with third parties only when necessary to provide our services, such as customs authorities, airlines, and delivery partners. We do not sell your personal information to third parties for marketing purposes.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted using SSL technology.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
                <p className="text-muted-foreground mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this privacy policy or our privacy practices, please contact us at:
                </p>
                <p className="text-foreground mt-2">
                  <strong>Email:</strong> privacy@wacclogistics.com<br />
                  <strong>Phone:</strong> +1 437 849 7607
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
