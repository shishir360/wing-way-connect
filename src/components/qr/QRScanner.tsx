import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff } from "lucide-react";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader";

  const startScanning = async () => {
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => { } // ignore errors during scanning
      );
      setIsScanning(true);
    } catch (err: any) {
      onError?.(err.message || "ক্যামেরা অ্যাক্সেস করা যাচ্ছে না");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  return (
    <div className="space-y-3">
      <div
        id={containerId}
        className="w-full rounded-xl overflow-hidden bg-muted min-h-[250px] flex items-center justify-center"
      >
        {!isScanning && (
          <div className="text-center p-4">
            <p className="text-muted-foreground text-sm mb-2">Camera is off</p>
            {!window.isSecureContext && (
              <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                ⚠️ Camera requires HTTPS (Secure Context).
                <br />
                Please ensure you are accessing via <strong>https://</strong>
              </div>
            )}
          </div>
        )}
      </div>
      <Button
        variant={isScanning ? "destructive" : "default"}
        className="w-full"
        onClick={isScanning ? stopScanning : startScanning}
      >
        {isScanning ? (
          <><CameraOff className="h-4 w-4 mr-2" /> স্ক্যানার বন্ধ করুন</>
        ) : (
          <><Camera className="h-4 w-4 mr-2" /> QR স্ক্যান করুন</>
        )}
      </Button>
    </div>
  );
}
