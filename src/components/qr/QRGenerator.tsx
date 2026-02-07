import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface QRGeneratorProps {
  shipment: any; // Using any for flexibility, but ideally should match Shipment type
}

export default function QRGenerator({ shipment }: QRGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const qrData = JSON.stringify({
    id: shipment.tracking_id,
    type: 'shipment',
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Safety check for null/undefined values
    const s = shipment || {};
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '-';

    printWindow.document.write(`
      <html>
        <head>
          <title>Waybill - ${s.tracking_id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; margin: 0; padding: 20px; color: #333; }
            .waybill { border: 2px solid #000; padding: 0; max-width: 800px; margin: 0 auto; position: relative; }
            .header { border-bottom: 2px solid #000; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
            .brand h1 { margin: 0; font-size: 28px; text-transform: uppercase; }
            .brand p { margin: 5px 0 0; font-size: 14px; }
            .tracking-box { text-align: right; }
            .tracking-id { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .status { font-size: 14px; text-transform: uppercase; border: 1px solid #000; padding: 2px 8px; display: inline-block; }
            
            .content { display: flex; border-bottom: 2px solid #000; }
            .section { flex: 1; padding: 15px; }
            .section:first-child { border-right: 2px solid #000; }
            .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 10px; font-size: 16px; }
            .row { margin-bottom: 5px; font-size: 14px; }
            .label { font-weight: bold; margin-right: 5px; }
            
            .details { padding: 15px; border-bottom: 2px solid #000; }
            .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            .detail-item .label { display: block; font-size: 12px; color: #666; }
            .detail-item .value { font-size: 16px; font-weight: bold; }
            
            .footer { padding: 20px; display: flex; justify-content: space-between; align-items: center; }
            .qr-container { text-align: center; }
            .signature { border-top: 1px solid #000; width: 200px; padding-top: 5px; margin-top: 40px; text-align: center; font-size: 12px; }
            
            @media print { 
              body { padding: 0; } 
              .waybill { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="waybill">
            <div class="header">
              <div class="brand">
                <h1>WACC Global</h1>
                <p>Worldwide Air Cargo & Courier</p>
              </div>
              <div class="tracking-box">
                <div class="tracking-id">${s.tracking_id}</div>
                <div class="status">${s.status?.replace('_', ' ') || 'PENDING'}</div>
              </div>
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">FROM (SENDER)</div>
                <div class="row"><span class="label">Name:</span> ${s.sender_name}</div>
                <div class="row"><span class="label">Phone:</span> ${s.sender_phone}</div>
                <div class="row"><span class="label">Email:</span> ${s.sender_email || '-'}</div>
                <div class="row"><span class="label">Address:</span> ${s.pickup_address || '-'}</div>
                <div class="row"><span class="label">City:</span> ${s.from_city || '-'}</div>
              </div>
              <div class="section">
                <div class="section-title">TO (RECEIVER)</div>
                <div class="row"><span class="label">Name:</span> ${s.receiver_name}</div>
                <div class="row"><span class="label">Phone:</span> ${s.receiver_phone}</div>
                <div class="row"><span class="label">Address:</span> ${s.delivery_address || '-'}</div>
                <div class="row"><span class="label">City:</span> ${s.to_city || '-'}</div>
              </div>
            </div>
            
            <div class="details">
              <div class="section-title">SHIPMENT DETAILS</div>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="label">Route</span>
                  <span class="value">${s.route === 'bd-to-ca' ? 'BD to CA' : 'CA to BD'}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Date</span>
                  <span class="value">${formatDate(s.created_at)}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Service Type</span>
                  <span class="value" style="text-transform: uppercase">${s.service_type || 'Standard'}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Weight</span>
                  <span class="value">${s.weight || '-'} kg</span>
                </div>
                <div class="detail-item">
                  <span class="label">Packages</span>
                  <span class="value">${s.packages || 1}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Total Cost</span>
                  <span class="value">${s.total_cost ? `$${s.total_cost}` : '-'}</span>
                </div>
              </div>
              <div style="margin-top: 15px; font-size: 14px;">
                <span class="label">Contents:</span> ${s.contents || 'N/A'}
              </div>
            </div>
            
            <div class="footer">
              <div class="qr-container">
                ${content.querySelector('svg')?.outerHTML || ''}
                <div style="font-size: 10px; margin-top: 5px;">Scan for Status</div>
              </div>
              <div>
                <div class="signature">Authorized Signature</div>
                <div class="signature">Receiver Signature & Date</div>
              </div>
            </div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      <div ref={printRef} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center">
        <QRCodeSVG value={qrData} size={150} level="M" />
        <p className="text-sm font-mono font-bold mt-2 text-primary">{shipment.tracking_id}</p>
        <div className="mt-2 text-xs text-center text-muted-foreground">
          <p>{shipment.route === 'bd-to-ca' ? '🇧🇩 → 🇨🇦' : '🇨🇦 → 🇧🇩'}</p>
          <p>{new Date(shipment.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs border rounded-lg p-2 bg-muted/50">
        <div>
          <span className="text-muted-foreground block">Sender</span>
          <span className="font-medium truncate block">{shipment.sender_name}</span>
        </div>
        <div>
          <span className="text-muted-foreground block">Receiver</span>
          <span className="font-medium truncate block">{shipment.receiver_name}</span>
        </div>
      </div>

      <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={handlePrint}>
        <Printer className="h-5 w-5 mr-2" />
        Print Full Waybill
      </Button>
    </div>
  );
}
