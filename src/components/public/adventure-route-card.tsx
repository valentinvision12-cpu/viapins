"use client";

import Image from "next/image";
import { IMAGE_UNOPTIMIZED, IMAGE_REFERRER_POLICY } from "@/lib/image-runtime";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Car, Compass, Mountain } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

interface Props {
  countrySlug: string;
  countryName: string;
  coverImage?: string;
  totalDays?: number;
  stopCount?: number;
  subtitle?: string;
}

export function AdventureRouteCard({
  countrySlug,
  countryName,
  coverImage = "",
  totalDays,
  stopCount,
  subtitle,
}: Props) {
  const t = useTranslations("adventureBanner");
  const [imgSrc, setImgSrc] = useState(coverImage);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgSrc(coverImage);
    setImgFailed(false);
  }, [coverImage]);

  const metaParts: string[] = [];
  if (totalDays && totalDays > 0) metaParts.push(t("days", { count: totalDays }));
  if (stopCount && stopCount > 0) metaParts.push(t("stops", { count: stopCount }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <Link
        href={`/explore/${countrySlug}/adventure`}
        className="block rounded-2xl overflow-hidden shadow-md border border-stone-200/60 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1"
      >
        <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden bg-gradient-to-br from-[#3a2a1a] to-[#6a4a2a]">
          {imgSrc && !imgFailed ? (
            <Image
              src={imgSrc}
              alt={`${countryName} road trip`}
              fill
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              referrerPolicy={IMAGE_REFERRER_POLICY}
              onError={() => setImgFailed(true)}
              unoptimized={IMAGE_UNOPTIMIZED}
            />
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/90 backdrop-blur-sm text-white text-xs font-bold shadow-lg tracking-wide uppercase">
            <Compass className="w-3.5 h-3.5" />
            {t("modeBadge")}
          </div>

          <div className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/25 text-white text-xs font-semibold">
            <Car className="w-3 h-3" />
            {t("badge")}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            {metaParts.length > 0 && (
              <div className="flex items-center gap-2 mb-2 text-white/80 text-xs font-medium">
                <Mountain className="w-3.5 h-3.5 text-orange-300" />
                <span>{metaParts.join(" - ")}</span>
              </div>
            )}
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <h3
                  className="font-bold text-2xl sm:text-3xl text-white leading-tight"
                  style={{ textShadow: "0 2px 14px rgba(0,0,0,0.7)" }}
                >
                  {t("title", { country: countryName })}
                </h3>
                <p className="text-white/75 text-sm mt-1.5 max-w-lg leading-relaxed line-clamp-2">
                  {subtitle || t("subtitle")}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 transition-colors">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}