import { redirect } from "next/navigation";

// Root path — redirect to the default locale
export default function RootPage() {
  redirect("/en");
}
