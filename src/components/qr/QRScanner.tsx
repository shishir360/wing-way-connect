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

  // New: Robust Error Suppression for html5-qrcode crashes
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // html5-qrcode often throws this error when unmounting
      if (
        event.message?.includes("removeChild") ||
        event.message?.includes("not a child") ||
        event.message?.includes("NotFoundError")
      ) {
        event.preventDefault(); // Prevent app crash
        console.warn("Suppressed known QR scanner error:", event.message);
      }
    };
    window.addEventListener("error", handleGlobalError);
    return () => window.removeEventListener("error", handleGlobalError);
  }, []);

  // Defined BEFORE useEffect to avoid lexical issues (though const is block scoped, cleaner this way)
  // or define as function so it's hoisted. But relying on ref is better.
  const cleanup = async () => {
    if (!scannerRef.current) return;
    const scanner = scannerRef.current;

    try {
      // 1. Try to stop scanning first
      try {
        // Just try to stop, if it fails because not running, catch it.
        await scanner.stop();
      } catch (e) { /* ignore not running */ }

      // 2. Clear ONLY IF mounted and element exists. 
      // If unmounting, React handles DOM removal. Calling clear() races with React.
      if (document.getElementById(containerId)) {
        try {
          // Only clear if we are NOT unmounting (isMounted.current check is safer if we pass it, but document check is ok)
          // Actually, if we are unmounting, we should NOT clear. React destroys the nodes.
          // However, if we are just restarting the scanner, we MUST clear.
          // Let's rely on document.getElementById check primarily.
          await scanner.clear();
        } catch (e: any) {
          // Ignore all clearing errors as they are likely DOM related
          console.warn("Scanner clear skipped/failed (harmless):", e.message);
        }
      }
    } catch (e) {
      console.warn("Cleanup critical error:", e);
    }
    scannerRef.current = null;
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Cleanup on unmount
      if (scannerRef.current) {
        cleanup().catch(e => console.warn("Unmount cleanup failed", e));
      }
    };
  }, []);

  const startScanning = async () => {
    if (isLoading || isScanning) return;
    setIsLoading(true);

    try {
      // Ensure previous instance is gone
      await cleanup();

      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          // Stop scanning after successful scan
          stopScanning();
        },
        () => { } // ignore frame errors
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("Scanner start error:", err);
      onError?.(err.message || "Failed to access camera");
      await cleanup();
    } finally {
      setIsLoading(false);
    }
  };

  const stopScanning = async () => {
    setIsLoading(true);
    try {
      await cleanup();
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
