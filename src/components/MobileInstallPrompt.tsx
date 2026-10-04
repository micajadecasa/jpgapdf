import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface MobileInstallPromptProps {
  forceOpen?: boolean;
  onCloseForce?: () => void;
}

const DISMISS_KEY = 'foliopdf_install_prompt_dismissed';

export const MobileInstallPrompt: React.FC<MobileInstallPromptProps> = ({
  forceOpen = false,
  onCloseForce,
}) => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // If user explicitly requested opening via button
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    // Do not show if already installed as standalone PWA
    if (isInstalled) return;

    // Show prompt on entry for smartphone users if not dismissed in this session
    const wasDismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!wasDismissed && (isMobile || isIOS || isInstallable)) {
      // Delay slightly (700ms) for smooth entry feel
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [forceOpen, isInstalled, isMobile, isIOS, isInstallable]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem(DISMISS_KEY, 'true');
    onCloseForce?.();
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setIsOpen(false);
      }
    } else if (isIOS) {
      setShowIOSSteps(true);
    } else {
      // Browser doesn't have prompt yet, show generic advice
      setShowIOSSteps(true);
    }
  };

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md p-5 shadow-2xl border border-slate-200 flex flex-col space-y-4 relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close X */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Cerrar aviso de instalación"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3 pr-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">Instala FolioPDF</h3>
              <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                App Móvil
              </span>
            </div>
            <p className="text-xs text-slate-500">Acceso instantáneo desde tu pantalla de inicio</p>
          </div>
        </div>

        {/* Value explanation */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Úsala a pantalla completa como una app nativa</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sin descargas pesadas de tienda, directa y privada</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Crea PDFs incluso sin conexión a internet</span>
          </div>
        </div>

        {/* Guided iOS steps if Safari */}
        {showIOSSteps ? (
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <p className="font-semibold flex items-center gap-1.5">
              <span>Cómo instalar en tu iPhone / iPad:</span>
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700">
              <li>
                Toca el botón <strong>Compartir</strong>{' '}
                <Share className="w-3.5 h-3.5 inline text-blue-600" /> en la barra inferior de
                Safari.
              </li>
              <li>
                Baja en el menú y pulsa <strong>"Añadir a pantalla de inicio"</strong>{' '}
                <PlusSquare className="w-3.5 h-3.5 inline text-slate-800" />.
              </li>
              <li>
                Pulsa <strong>"Añadir"</strong> arriba a la derecha. ¡Listo!
              </li>
            </ol>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center"
          >
            Ahora no
          </button>

          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-2 py-2.5 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <Download className="w-4 h-4" />
            <span>{isIOS ? 'Ver cómo instalar' : 'Instalar en el móvil'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
