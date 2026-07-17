import type { Metadata } from "next";
import { NavHeader } from "@/components/public/nav-header";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { SITE_NAME, SITE_DEFAULT_URL, SITE_LEGAL_EMAIL } from "@/lib/site-brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of Service for ${SITE_NAME}.`,
};

export default function TermsPage() {
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

          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-white/35 text-sm mb-10">
            Last updated: {new Date().toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
          </p>

          <div className="prose prose-invert prose-sm max-w-none space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.title}>
                <h2 className="text-lg font-semibold text-white mb-3">{s.title}</h2>
                <div className="text-white/50 leading-relaxed space-y-2">
                  {s.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    paragraphs: [
      "By accessing and using ViaPins ('the Service'), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this Service.",
      "We reserve the right to update these terms at any time. Continued use of the Service after any changes constitutes your acceptance of the new terms.",
    ],
  },
  {
    title: "2. Description of Service",
    paragraphs: [
      "ViaPins provides a platform for discovering travel destinations, creating personalised routes, and sharing travel experiences. The Service includes destination pages, route building tools, and a personal travel passport.",
      "We reserve the right to modify or discontinue the Service with or without notice at any time.",
    ],
  },
  {
    title: "3. User Accounts",
    paragraphs: [
      "To access certain features of the Service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials.",
      "You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.",
      "We reserve the right to suspend or terminate your account if any information provided is inaccurate, not current, or incomplete.",
    ],
  },
  {
    title: "4. User-Generated Content",
    paragraphs: [
      "Users may create and share travel routes through the Service. By submitting content, you grant ViaPins a non-exclusive, royalty-free licence to use, reproduce, and display that content in connection with the Service.",
      "You represent that you own or have the necessary rights to the content you submit, and that it does not violate any third-party rights or applicable laws.",
    ],
  },
  {
    title: "5. Intellectual Property",
    paragraphs: [
      "The Service and its original content (excluding user-generated content), features, and functionality are and will remain the exclusive property of ViaPins and its licensors.",
      "Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of ViaPins.",
    ],
  },
  {
    title: "6. Third-Party Links",
    paragraphs: [
      "The Service may contain links to third-party websites or services, including Google Maps. These third-party sites have separate and independent privacy policies. We have no responsibility or liability for the content and activities of these linked sites.",
    ],
  },
  {
    title: "7. Disclaimer of Warranties",
    paragraphs: [
      "The Service is provided on an 'AS IS' and 'AS AVAILABLE' basis without any warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.",
      "We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.",
    ],
  },
  {
    title: "8. Limitation of Liability",
    paragraphs: [
      "In no event shall ViaPins, its directors, employees, or agents, be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.",
    ],
  },
  {
    title: "9. Governing Law",
    paragraphs: [
      "These Terms shall be governed and construed in accordance with the laws applicable in the jurisdiction where the company is registered, without regard to its conflict of law provisions.",
    ],
  },
  {
    title: "10. Contact Us",
    paragraphs: [
      `If you have any questions about these Terms, please contact us via the contact form on our website or by email at ${SITE_LEGAL_EMAIL}.`,
    ],
  },
];
