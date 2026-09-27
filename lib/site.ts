import type { Metadata } from "next";

const PRODUCTION_HOST =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "printstacker.vercel.app";

export const siteUrl = `https://${PRODUCTION_HOST}`;

export const siteName = "Print Stacker";

export const homeTitle = "Print Stacker — stack an STL into a 3MF";

export const homeDescription =
  "Stack copies of an STL into a 3MF for Bambu Studio or any slicer. Vertical stack printing in the browser, with a layer-aligned gap. Nothing is uploaded.";

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const fullTitle = `${title} · ${siteName}`;

  const image = {
    url: "/opengraph-image",
    width: 1200,
    height: 630,
    alt: homeTitle,
  };

  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
