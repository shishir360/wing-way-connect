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
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader";
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const handleGlobalError = (event: ErrorEvent) => {
      // html5-qrcode often throws this error when unmounting
      if (
        event.message?.includes("removeChild") ||
        event.message?.includes("not a child") ||
        event.message?.includes("NotFoundError") ||
        event.message?.includes("Failed to execute 'removeChild'") ||
        event.message?.includes("Cannot read properties of null")
      ) {
        event.preventDefault(); // Prevent app crash
        console.warn("Suppressed known QR scanner error:", event.message);
      }
    };

    window.addEventListener("error", handleGlobalError);
    return () => {
      isMounted.current = false;
      window.removeEventListener("error", handleGlobalError);
      // Cleanup on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(e => console.warn("Unmount cleanup failed", e));
      }
    };
  }, []);

  const startScanning = async () => {
    if (isLoading || isScanning) return;
    setIsLoading(true);

    try {
      // If there's an existing instance that's scanning, stop it safely first
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(() => { });
      }

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (!isMounted.current) return;
          onScan(decodedText);

          // Stop scanning after successful scan, but DO NOT call clear().
          // Calling clear throws DOM errors because React might be unmounting it concurrently.
          if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(() => { });
          }
          setIsScanning(false);
        },
        () => { } // ignore frame errors
      );
      if (isMounted.current) {
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error("Scanner start error:", err);
      if (isMounted.current) {
        onError?.(err.message || "Failed to access camera");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const stopScanning = async () => {
    setIsLoading(true);
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Stop failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        id={containerId}
        className="w-full rounded-xl overflow-hidden bg-muted min-h-[300px] flex items-center justify-center relative border shadow-inner"
      >
        {(!isScanning || isLoading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10 bg-muted/80 backdrop-blur-sm">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                <p className="text-sm font-medium">Starting Camera...</p>
                <p className="text-xs text-muted-foreground">Please allow permissions</p>
              </div>
            ) : !isScanning ? (
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-3">Camera is currently off</p>
                {!window.isSecureContext && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-2">
                    ⚠️ HTTPS Required
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>

      <Button
        variant={isScanning ? "destructive" : "default"}
        className="w-full h-12 text-base shadow-md"
        onClick={isScanning ? stopScanning : startScanning}
        disabled={isLoading}
      >
        {isLoading ? (
          "Please wait..."
        ) : isScanning ? (
          <><CameraOff className="h-5 w-5 mr-2" /> Stop Scanner</>
        ) : (
          <><Camera className="h-5 w-5 mr-2" /> Start Scanner</>
        )}
      </Button>
    </div>
  );
}
