/**
 * Prerender Script for SEO
 * Generates static HTML files for key routes to improve SEO
 * Run after build: node prerender.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, "dist");
const indexPath = path.join(distDir, "index.html");

// Routes to prerender with their content
const routes = {
  "/": {
    title:
      "Diagrammatic — Interactive System Design Playground | Learn Architecture Design",
    description:
      "Master system design with Diagrammatic - an interactive playground featuring 1k+ components including AWS, Azure & GCP cloud components, AI assessment, UML & ER diagrams, and 90+ practice problems. Free system architecture tool for students, professionals, and educators.",
    keywords:
      "system design, architecture diagram, system design interview, software architecture, distributed systems, AWS architecture, Azure architecture, GCP architecture, cloud design, ER diagram, UML diagram",
    image: "https://diagrammatic.next-zen.dev/og/home.png",
    imageAlt: "Diagrammatic homepage preview",
    content: `
      <h1>Diagrammatic - Interactive System Design Playground</h1>
      <p>Master system design with our interactive playground. Learn to design scalable, production-ready architectures with cloud provider support.</p>
      <h2>Key Features</h2>
      <ul>
        <li>1k+ System Design Components</li>
        <li>AWS, Azure & GCP Cloud Components</li>
        <li>AI-Powered Assessment & Recommendations</li>
        <li>90+ Practice Problems</li>
        <li>35+ Cloud Infrastructure Design Challenges</li>
        <li>Real-time Collaboration</li>
        <li>UML & ER Diagrams</li>
        <li>Export as PNG, JPEG, SVG, JSON, XML</li>
        <li>Smart Component Search</li>
      </ul>
    `,
  },
  "/#/playground/free": {
    title: "Free Design Studio | Diagrammatic",
    description:
      "Create unlimited system architecture diagrams for free. 1k+ components including AWS, Azure, GCP cloud components, load balancers, databases, caches, queues, and more. Export as PNG, JPEG, SVG, JSON, or XML. No signup required.",
    keywords:
      "free system design tool, architecture diagram maker, cloud architecture, microservices design, AWS diagram, Azure diagram, GCP diagram, ER diagram, UML diagram",
    image: "https://diagrammatic.next-zen.dev/og/playground.png",
    imageAlt: "Diagrammatic design playground preview",
    content: `
      <h1>Free Design Studio</h1>
      <p>Create unlimited architecture diagrams with 1k+ professional components including AWS, Azure & GCP cloud services. Export in multiple formats. No signup required.</p>
    `,
  },
  "/problems": {
    title: "Practice Problems | Diagrammatic",
    description:
      "Practice system design with 90+ real-world challenges. Get AI-powered feedback and recommendations on your architecture designs. Perfect for FAANG interview preparation.",
    keywords:
      "system design interview, system design practice, distributed systems problems, scalable architecture, FAANG interview, tech interview prep",
    image: "https://diagrammatic.next-zen.dev/og/problems.png",
    imageAlt: "Diagrammatic practice problems preview",
    content: `
      <h1>System Design Practice Problems</h1>
      <p>Practice with 90+ real-world system design challenges. Get instant AI-powered assessment and smart recommendations on your solutions.</p>
      <section>
        <h2>Problem categories</h2>
        <ul>
          <li>Distributed systems, scaling, and reliability</li>
          <li>AI / ML and MLOps architecture problems</li>
          <li>Application and product design scenarios</li>
          <li>Infrastructure, caching, queues, and search</li>
        </ul>
      </section>
    `,
  },
  "/learning-paths": {
    title: "Learning Paths | Diagrammatic",
    description:
      "Structured learning paths that guide you through system design concepts, examples, and exercises.",
    keywords: "system design learning path, system design tutorial, system architecture learning",
    image: "https://diagrammatic.next-zen.dev/og/learning-paths.png",
    imageAlt: "Diagrammatic learning paths preview",
    content: `
      <h1>Learning Paths</h1>
      <p>Follow curated learning paths that teach system design from first principles through practical examples.</p>
    `,
  },
  "/learning-paths/system-design-foundations": {
    title: "System Design Foundations | Diagrammatic",
    description: "Introductory path: What is System Design and key trade-offs to consider.",
    keywords: "what is system design, system design foundations, scalability, reliability",
    image: "https://diagrammatic.next-zen.dev/og/learning-path.png",
    imageAlt: "System Design Foundations learning path preview",
    content: `
      <h1>System Design Foundations</h1>
      <p>Start with the basics: goals of system design, core concepts, and common trade-offs.</p>
    `,
  },
  "/learning-paths/cache-fundamentals": {
    title: "Cache Fundamentals | Diagrammatic",
    description:
      "Learn cache tiers, cache-aside, read-through, write-through, TTLs, eviction, invalidation, cache stampede handling, and CDN boundaries.",
    keywords:
      "cache fundamentals, cache aside, read through, write through, write back, cache stampede, cache invalidation, ttl, eviction policy, cdn cache",
    image: "https://diagrammatic.next-zen.dev/og/learning-path.png",
    imageAlt: "Cache Fundamentals learning path preview",
    content: `
      <h1>Cache Fundamentals</h1>
      <p>Learn how cache tiers, cache-aside, freshness rules, stampede protection, and CDN boundaries improve performance while keeping systems predictable.</p>
    `,
  },
};

// Try to discover learning-paths from the built dist JSON and add them to routes
try {
  const lpPath = path.join(distDir, "learning-paths", "learning-paths.json");
  if (fs.existsSync(lpPath)) {
    const lpRaw = fs.readFileSync(lpPath, "utf-8");
    const lpList = JSON.parse(lpRaw);
    if (Array.isArray(lpList)) {
        lpList.forEach((item) => {
          const slug = item?.slug;
          if (slug) {
            const routeKey = `/learning-paths/${slug}`;
            if (!routes[routeKey]) {
              const title = item?.title ?? slug;
              const summary = item?.summary ?? "";
              const keywords = item?.tags?.join(", ") ?? "system design, learning path";
              routes[routeKey] = {
                title,
                description: item?.summary ?? item?.title ?? "",
                keywords,
                image: "https://diagrammatic.next-zen.dev/og/learning-path.png",
                imageAlt: title,
                content: `<h1>${title}</h1><p>${summary.replace(/\n/g, " ")}</p>`,
              };
            }
          }
        });
      console.log(`ℹ️ Added ${lpList.length} learning-path routes from ${lpPath}`);
    }
  }
} catch (err) {
  console.warn("⚠️ Could not load learning-paths JSON:", err.message);
}

// Check if dist exists
if (!fs.existsSync(distDir)) {
  console.error('❌ Dist directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Read the base index.html
const baseHtml = fs.readFileSync(indexPath, "utf-8");

console.log("🚀 Starting prerendering...\n");

// Generate HTML for each route
Object.entries(routes).forEach(([route, data]) => {
  let html = baseHtml;
  const canonicalUrl =
    route === "/"
      ? "https://diagrammatic.next-zen.dev/"
      : `https://diagrammatic.next-zen.dev${route}`;

  // Update title
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${data.title}</title>`);

  // Update meta title
  html = html.replace(
    /<meta\s+name="title"[\s\S]*?\/>/,
    `<meta name="title" content="${data.title}" />`,
  );

  // Update meta description
  html = html.replace(
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${data.description}">`,
  );

  // Update meta keywords
  html = html.replace(
    /<meta\s+name="keywords"[\s\S]*?\/>/,
    `<meta name="keywords" content="${data.keywords}">`,
  );

  // Update OG title
  html = html.replace(
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${data.title}">`,
  );

  // Update OG description
  html = html.replace(
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${data.description}">`,
  );

  // Update OG image metadata
  html = html.replace(
    /<meta\s+property="og:image"[\s\S]*?\/>/,
    `<meta property="og:image" content="${data.image}">`,
  );
  html = html.replace(
    /<meta\s+property="og:image:alt"[\s\S]*?\/>/,
    `<meta property="og:image:alt" content="${data.imageAlt || data.title}">`,
  );

  // Update OG URL and canonical URL
  html = html.replace(
    /<meta\s+property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${canonicalUrl}">`,
  );
  html = html.replace(
    /<link\s+rel="canonical"[\s\S]*?\/>/,
    `<link rel="canonical" href="${canonicalUrl}" />`,
  );

  // Update Twitter metadata
  html = html.replace(
    /<meta\s+name="twitter:url"[\s\S]*?\/>/,
    `<meta name="twitter:url" content="${canonicalUrl}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${data.title}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${data.description}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:image"[\s\S]*?\/>/,
    `<meta name="twitter:image" content="${data.image}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:image:alt"[\s\S]*?\/>/,
    `<meta name="twitter:image:alt" content="${data.imageAlt || data.title}" />`,
  );

  // Inject prerendered content into the SEO content div
  html = html.replace(
    /<div\s+id="seo-content"[\s\S]*?<article>[\s\S]*?<\/article>/,
    `<div id="seo-content" style="position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden;"><article>${data.content}</article>`,
  );

  // Determine output path
  let outputPath;
  if (route === "/") {
    outputPath = indexPath;
  } else if (route.startsWith("/#/")) {
    // For hash routes, create a flat file using hyphenated name (can't map to nested path)
    const routeName = (route.replace("/#/", "").replace(/\//g, "-") || "index").replace(/^-+/, "");
    outputPath = path.join(distDir, `${routeName}.html`);
  } else {
    // Create nested folders so URLs like /learning-paths/slug/ map to
    // dist/learning-paths/slug/index.html which most static hosts serve
    const parts = route.split("/").filter(Boolean); // ['learning-paths','system-design-foundations']
    const outDir = path.join(distDir, ...parts);
    fs.mkdirSync(outDir, { recursive: true });
    outputPath = path.join(outDir, "index.html");
  }

  // Write the file
  fs.writeFileSync(outputPath, html, "utf-8");
  console.log(`✅ Generated: ${route} -> ${path.basename(outputPath)}`);
});
