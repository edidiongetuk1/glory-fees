import { useEffect } from "react";

type PageMetaOptions = {
  title: string;
  description?: string;
  canonicalPath?: string;
};

export function usePageMeta({ title, description, canonicalPath }: PageMetaOptions) {
  useEffect(() => {
    document.title = title;

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description;
    }

    const href = canonicalPath
      ? new URL(canonicalPath, window.location.origin).toString()
      : window.location.href.split("#")[0];

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = href;
  }, [title, description, canonicalPath]);
}
