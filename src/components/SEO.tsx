import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  url?: string;
  type?: string;
}

const DEFAULT_SEO = {
  title:
    "Diagrammatic — Design architectures. Get them reviewed.",
  description:
    "Practice system design by building architectures visually, explaining your assumptions, and getting structured feedback on scalability, reliability, data design, and trade-offs.",
  keywords:
    "system design, architecture diagram, system design interview, software architecture, distributed systems, scalable architecture",
  image: "https://diagrammatic.next-zen.dev/og/home.png",
  imageAlt: "Diagrammatic homepage preview",
  url: "https://diagrammatic.next-zen.dev/",
  type: "website",
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  imageAlt,
  url,
  type = "website",
}) => {
  useEffect(() => {
    // Update document title
    document.title = title || DEFAULT_SEO.title;

    // Update meta tags
    const updateMetaTag = (
      name: string,
      content: string,
      isProperty = false,
    ) => {
      const attribute = isProperty ? "property" : "name";
      let element = document.querySelector(
        `meta[${attribute}="${name}"]`,
      ) as HTMLMetaElement;

      if (element) {
        element.content = content;
      } else {
        element = document.createElement("meta");
        element.setAttribute(attribute, name);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Standard meta tags
    updateMetaTag("description", description || DEFAULT_SEO.description);
    updateMetaTag("keywords", keywords || DEFAULT_SEO.keywords);

    // Open Graph tags
    updateMetaTag("og:title", title || DEFAULT_SEO.title, true);
    updateMetaTag(
      "og:description",
      description || DEFAULT_SEO.description,
      true,
    );
    updateMetaTag("og:image", image || DEFAULT_SEO.image, true);
    updateMetaTag(
      "og:image:alt",
      imageAlt || title || DEFAULT_SEO.title,
      true,
    );
    updateMetaTag("og:url", url || DEFAULT_SEO.url, true);
    updateMetaTag("og:type", type, true);

    // Twitter tags
    updateMetaTag("twitter:title", title || DEFAULT_SEO.title);
    updateMetaTag(
      "twitter:description",
      description || DEFAULT_SEO.description,
    );
    updateMetaTag("twitter:image", image || DEFAULT_SEO.image);
    updateMetaTag(
      "twitter:image:alt",
      imageAlt || title || DEFAULT_SEO.title,
    );
    updateMetaTag("twitter:url", url || DEFAULT_SEO.url);

    // Update canonical link
    let canonical = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (canonical) {
      canonical.href = url || DEFAULT_SEO.url;
    } else {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = url || DEFAULT_SEO.url;
      document.head.appendChild(canonical);
    }
  }, [title, description, keywords, image, imageAlt, url, type]);

  return null;
};

export default SEO;
