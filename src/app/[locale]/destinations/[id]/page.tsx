import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getDestinationById } from "@/actions/get-destinations";
import { slugify } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

/** Legacy UUID URLs → canonical /explore/country/city */
export default async function DestinationPage({ params }: Props) {
  const { locale, id } = await params;
  const destination = await getDestinationById(id);
  if (!destination) notFound();

  redirect({
    href: `/explore/${slugify(destination.country)}/${slugify(destination.city)}`,
    locale,
  });
}
