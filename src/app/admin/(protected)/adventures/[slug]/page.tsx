import { notFound } from "next/navigation";
import { getAdventureForAdmin } from "@/actions/admin-adventure";
import { AdventureEditClient } from "@/components/admin/adventure-edit-client";

export const metadata = { title: "Adventure редакция" };

type Props = { params: Promise<{ slug: string }> };

export default async function AdventureEditPage({ params }: Props) {
  const { slug } = await params;
  const adventure = await getAdventureForAdmin(slug);
  if (!adventure) notFound();
  return <AdventureEditClient adventure={adventure} />;
}
