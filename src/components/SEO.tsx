import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_SEO = {
  title: 'Diagrammatic — Interactive System Design Playground | Learn Architecture Design',
  description: 'Master system design with Diagrammatic - an interactive playground featuring 45+ components, AI assessment, and real-world practice problems. Free system architecture tool for students, professionals, and educators.',
  keywords: 'system design, architecture diagram, system design interview, software architecture, distributed systems, scalable architecture',
  image: 'https://satya00089.github.io/diagrammatic/logo.png',
  url: 'https://satya00089.github.io/diagrammatic/',
  type: 'website'
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website'
}) => {
  useEffect(() => {
    // Update document title
    document.title = title || DEFAULT_SEO.title;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (element) {
        element.content = content;
      } else {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        element.content = content;
        document.head.appendChild(element);
      }
    };

    // Standard meta tags
    updateMetaTag('description', description || DEFAULT_SEO.description);
    updateMetaTag('keywords', keywords || DEFAULT_SEO.keywords);

    // Open Graph tags
    updateMetaTag('og:title', title || DEFAULT_SEO.title, true);
    updateMetaTag('og:description', description || DEFAULT_SEO.description, true);
    updateMetaTag('og:image', image || DEFAULT_SEO.image, true);
    updateMetaTag('og:url', url || DEFAULT_SEO.url, true);
    updateMetaTag('og:type', type, true);

    // Twitter tags
    updateMetaTag('twitter:title', title || DEFAULT_SEO.title);
    updateMetaTag('twitter:description', description || DEFAULT_SEO.description);
    updateMetaTag('twitter:image', image || DEFAULT_SEO.image);
    updateMetaTag('twitter:url', url || DEFAULT_SEO.url);

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      canonical.href = url || DEFAULT_SEO.url;
    } else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = url || DEFAULT_SEO.url;
      document.head.appendChild(canonical);
    }
  }, [title, description, keywords, image, url, type]);

  return null;
};

export default SEO;
