import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
};

// Lightweight per-route <head> updater. This app is a client-only SPA (no
// server render), so there is no request/response cycle to attach <head>
// tags to — we just keep document.title and the description meta in sync
// with whichever page is mounted, mirroring what each route's `head()`
// config used to declare under TanStack Start.
export function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    let descriptionTag: HTMLMetaElement | null = null;
    let previousDescription: string | null = null;

    if (description) {
      descriptionTag = document.querySelector('meta[name="description"]');
      if (descriptionTag) {
        previousDescription = descriptionTag.getAttribute("content");
        descriptionTag.setAttribute("content", description);
      }
    }

    return () => {
      document.title = previousTitle;
      if (descriptionTag && previousDescription !== null) {
        descriptionTag.setAttribute("content", previousDescription);
      }
    };
  }, [title, description]);

  return null;
}
