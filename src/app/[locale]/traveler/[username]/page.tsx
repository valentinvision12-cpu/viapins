import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPublicTraveler } from "@/actions/follows";
import { NavHeader } from "@/components/public/nav-header";
import { TravelerPublicProfile } from "@/components/public/traveler-public-profile";
import { PASSPORT } from "@/lib/luxury-palette";
import { SITE_NAME } from "@/lib/site-brand";

type Props = { params: Promise<{ locale: string; username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const traveler = await getPublicTraveler(username);
  if (!traveler) return { title: "Traveler" };
  const name = traveler.full_name || traveler.username;
  return {
    title: `${name} (@${traveler.username}) | ${SITE_NAME}`,
    description: traveler.bio || `Travel passport of @${traveler.username}`,
  };
}

export default async function TravelerPage({ params }: Props) {
  const { username } = await params;
  const t = await getTranslations("myTrip");
  const traveler = await getPublicTraveler(username);
  if (!traveler) notFound();

  return (
    <>
      <NavHeader />
      <main
        className="min-h-screen pt-20"
        style={{ background: PASSPORT.bgGradient, color: PASSPORT.text }}
      >
        <div className="container mx-auto max-w-3xl px-6 py-10">
          <p
            className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: PASSPORT.accent }}
          >
            {t("travelerPublicEyebrow")}
          </p>
          <TravelerPublicProfile traveler={traveler} />
        </div>
      </main>
    </>
  );
}
