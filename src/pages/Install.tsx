import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20 max-w-lg">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Install FataFat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isInstalled ? (
              <div className="flex flex-col items-center gap-3">
                <Check className="h-12 w-12 text-green-500" />
                <p className="text-muted-foreground">FataFat is already installed on your device!</p>
              </div>
            ) : deferredPrompt ? (
              <>
                <p className="text-muted-foreground">
                  Add FataFat to your home screen for quick access, offline support, and a native app experience.
                </p>
                <Button onClick={handleInstall} size="lg" className="w-full gap-2">
                  <Download className="h-5 w-5" />
                  Install App
                </Button>
              </>
            ) : (
              <div className="space-y-4 text-left">
                <p className="text-muted-foreground text-center">
                  Install FataFat on your device for the best experience.
                </p>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">iPhone / iPad (Safari)</h3>
                    <p className="text-sm text-muted-foreground">
                      Tap the <strong>Share</strong> button → <strong>Add to Home Screen</strong>
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Android (Chrome)</h3>
                    <p className="text-sm text-muted-foreground">
                      Tap the <strong>⋮ menu</strong> → <strong>Add to Home Screen</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Install;
