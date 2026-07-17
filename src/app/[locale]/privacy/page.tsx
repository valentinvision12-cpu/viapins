import type { Metadata } from "next";
import { NavHeader } from "@/components/public/nav-header";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { SITE_NAME, SITE_PRIVACY_EMAIL } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${SITE_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <>
      <NavHeader />
      <main
        className="min-h-screen pt-20 pb-20"
        style={{ background: "oklch(0.12 0.06 252)" }}
      >
        <div className="container max-w-3xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-white/35 text-sm mb-10">
            Last updated:{" "}
            {new Date().toLocaleDateString("en", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="text-lg font-semibold text-white mb-3">{s.title}</h2>
                <div className="text-white/50 leading-relaxed space-y-2">
                  {s.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {s.bullets && (
                    <ul className="list-disc pl-5 space-y-1 text-white/40">
                      {s.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

const SECTIONS: { title: string; paragraphs: string[]; bullets?: string[] }[] = [
  {
    title: "1. Introduction",
    paragraphs: [
      "At ViaPins ('we', 'us', 'our'), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.",
    ],
  },
  {
    title: "2. Information We Collect",
    paragraphs: [
      "We may collect the following types of information:",
    ],
    bullets: [
      "Account information: email address, name (when you create an account via Magic Link or Google OAuth).",
      "Travel data: routes you create and save, destinations you explore.",
      "Usage data: pages viewed, features used, device and browser information.",
      "Cookies and tracking technologies: session cookies for authentication, performance cookies for analytics.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    paragraphs: [
      "We use the information we collect to:",
    ],
    bullets: [
      "Provide, operate, and maintain the Service.",
      "Manage your account and provide customer support.",
      "Save and synchronise your travel routes across devices.",
      "Send you service-related notifications (e.g., Magic Link emails).",
      "Analyse usage patterns to improve the Service.",
      "Display relevant advertisements (where applicable).",
    ],
  },
  {
    title: "4. Data Storage and Security",
    paragraphs: [
      "Your data is stored securely using Supabase (PostgreSQL) with row-level security enabled. All data is encrypted in transit via HTTPS/TLS.",
      "We implement commercially reasonable security measures to protect your information, but no method of transmission over the Internet is 100% secure.",
    ],
  },
  {
    title: "5. Third-Party Services",
    paragraphs: [
      "We integrate with the following third-party services:",
    ],
    bullets: [
      "Supabase: database and authentication provider (supabase.com).",
      "Google OAuth: optional sign-in method (policies.google.com/privacy).",
      "Google Maps: navigation links (policies.google.com/privacy).",
      "Wikimedia Commons: destination images (wikimediafoundation.org/wiki/Privacy_policy).",
      "Advertising networks (if configured): may set cookies for ad personalisation.",
    ],
  },
  {
    title: "6. Cookies",
    paragraphs: [
      "We use cookies for authentication sessions and analytics. You can control cookies through your browser settings. Disabling cookies may affect certain features of the Service.",
    ],
  },
  {
    title: "7. Your Rights",
    paragraphs: [
      "Depending on your location, you may have the following rights regarding your personal data:",
    ],
    bullets: [
      "Right of access: request a copy of your personal data.",
      "Right of rectification: correct inaccurate data.",
      "Right of erasure: request deletion of your account and data.",
      "Right to data portability: receive your data in a machine-readable format.",
      "Right to object: object to processing of your personal data.",
    ],
  },
  {
    title: "8. Children's Privacy",
    paragraphs: [
      "The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us.",
    ],
  },
  {
    title: "9. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the 'Last updated' date.",
    ],
  },
  {
    title: "10. Contact Us",
    paragraphs: [
      `If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us at: ${SITE_PRIVACY_EMAIL}`,
    ],
  },
];
