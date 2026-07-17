"use client";

import { ShareButton } from "@/components/public/share-button";

interface Props {
  url: string;
  title: string;
  description?: string;
  variant?: "default" | "compact" | "pill";
  className?: string;
}

export function ShareDestinationButton(props: Props) {
  return <ShareButton {...props} />;
}
