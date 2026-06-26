import { useState, useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useBodyWise } from "../context/BodyWiseContext";

export default function PwaPrompts() {
  const { loading } = useBodyWise();
  
  // SW registration and update hooks
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [showUpdate, setShowUpdate] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [welcomeToast, setWelcomeToast] = useState("");

  // 1. Safe Update Check: Delay version updates if the user is typing, chatting, uploading, or analyzing
  useEffect(() => {
    if (needRefresh) {
      const checkUserBusy = () => {
        const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
        const isAnalyzing = loading.body || loading.lifestyle || loading.food || loading.habit;
        const isChatting = window.location.pathname === "/coach" && isTyping;

        return isTyping || isAnalyzing || isChatting;
      };

      // If user is idle right now, show immediately
      if (!checkUserBusy()) {
        setShowUpdate(true);
      } else {
        // Otherwise, poll every 4 seconds until they are no longer busy
        const interval = setInterval(() => {
          if (!checkUserBusy()) {
            setShowUpdate(true);
            clearInterval(interval);
          }
        }, 4000);
        return () => clearInterval(interval);
      }
    }
  }, [needRefresh, loading]);

  // 2. Custom Install Promotion Capture
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      
      // Check if user dismissed the prompt permanently
      const isDismissed = localStorage.getItem("bw_pwa_dismissed") === "true";
      if (isDismissed) return;

      setInstallPrompt(e);
      setShowInstall(true);
    };

    const handleAppInstalled = () => {
      setShowInstall(false);
      setInstallPrompt(null);
      setWelcomeToast("BodyWise AI installed successfully! Access your dashboard from your home screen.");
      setTimeout(() => setWelcomeToast(""), 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    // Trigger browser prompt dialog
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowInstall(false);
      setInstallPrompt(null);
    }
  };

  const handleInstallLater = () => {
    setShowInstall(false);
    // Dismiss permanently to respect user decision
    localStorage.setItem("bw_pwa_dismissed", "true");
  };

  // Keyboard navigation helpers (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showUpdate) setNeedRefresh(false);
        if (showInstall) setShowInstall(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showUpdate, showInstall, setNeedRefresh]);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-[380px] w-[calc(100vw-40px)] pointer-events-none">
      
      {/* ─── PWA Install Banner ─── */}
      {showInstall && (
        <div 
          className="glass p-4 rounded-xl border border-[var(--border-hover)] bg-[var(--bg-surface)] backdrop-blur-md shadow-2xl pointer-events-auto flex flex-col gap-3.5 animate-[fadeUp_0.4s_ease-out_both]"
          role="alertdialog"
          aria-labelledby="install-title"
          aria-describedby="install-desc"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--cyan-dim)] border border-[var(--border-accent)] text-lg shrink-0">
              🧬
            </div>
            <div>
              <div id="install-title" className="font-syne font-bold text-sm text-[var(--text-primary)]">
                Install BodyWise AI
              </div>
              <div id="install-desc" className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-medium">
                Access your AI Health Dashboard directly from your Home Screen for immediate offline access and native load speeds.
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button 
              onClick={handleInstallLater}
              className="btn btn-ghost h-8.5 px-4 text-xs font-semibold py-0"
              aria-label="Dismiss app installation"
            >
              Later
            </button>
            <button 
              onClick={handleInstallClick}
              className="btn btn-cyan h-8.5 px-4 text-xs font-bold py-0"
              aria-label="Install BodyWise AI on home screen"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* ─── Service Worker Update Toast ─── */}
      {showUpdate && (
        <div 
          className="glass p-4 rounded-xl border border-[var(--border-hover)] bg-[var(--bg-surface)] backdrop-blur-md shadow-2xl pointer-events-auto flex flex-col gap-3.5 animate-[fadeUp_0.4s_ease-out_both]"
          role="alertdialog"
          aria-labelledby="update-title"
          aria-describedby="update-desc"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--violet-dim)] border border-[var(--border-accent-violet)] text-lg shrink-0">
              🚀
            </div>
            <div>
              <div id="update-title" className="font-syne font-bold text-sm text-[var(--text-primary)]">
                New Version Available
              </div>
              <div id="update-desc" className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-medium">
                A new version of BodyWise AI is available. Reload the platform to sync client updates.
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button 
              onClick={() => { setShowUpdate(false); setNeedRefresh(false); }}
              className="btn btn-ghost h-8.5 px-4 text-xs font-semibold py-0"
              aria-label="Dismiss platform update"
            >
              Later
            </button>
            <button 
              onClick={() => updateServiceWorker(true)}
              className="btn btn-violet h-8.5 px-4 text-xs font-bold py-0"
              aria-label="Update and reload platform now"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* ─── Installation Success Welcome Toast ─── */}
      {welcomeToast && (
        <div 
          className="glass p-3 px-4 rounded-xl border border-[var(--emerald)] bg-[var(--emerald-dim)] backdrop-blur-md shadow-xl pointer-events-auto animate-[fadeUp_0.3s_ease-out_both] text-[13px] text-[var(--emerald)] font-semibold flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span>✔️</span>
          <span>{welcomeToast}</span>
        </div>
      )}
      
    </div>
  );
}
