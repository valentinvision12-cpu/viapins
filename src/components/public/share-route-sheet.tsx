"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  onCopy: () => void;
  copied: boolean;
}

export function ShareRouteSheet({ open, onClose, shareUrl, onCopy, copied }: Props) {
  const t = useTranslations("route");

  function shareWhatsApp() {
    const text = encodeURIComponent(`${t("shareMessage")}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function shareTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(t("shareMessage"))}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl px-5 pt-4 pb-8"
          >
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-stone-200" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-stone-900 font-semibold">{t("shareTitle")}</h3>
              <button type="button" onClick={onClose} className="p-1.5 text-stone-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="py-3 rounded-xl bg-[#25D366]/10 text-[#128C7E] text-xs font-semibold"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={shareTelegram}
                className="py-3 rounded-xl bg-[#0088cc]/10 text-[#0088cc] text-xs font-semibold"
              >
                Telegram
              </button>
              <button
                type="button"
                onClick={onCopy}
                className="py-3 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold flex flex-col items-center justify-center gap-1"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Link2 className="w-5 h-5" />}
                {copied ? t("shareCopied") : t("shareCopy")}
              </button>
            </div>
            <p className="text-stone-400 text-[11px] text-center break-all">{shareUrl}</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
