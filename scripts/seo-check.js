#!/usr/bin/env node
/**
 * SEO Health Check Script
 * Validates SEO best practices for the application
 * Run: npm run seo:check
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const checks = {
  passed: [],
  warnings: [],
  failed: [],
};

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    checks.passed.push(`✅ ${description}`);
    return true;
  } else {
    checks.failed.push(`❌ ${description} - File not found: ${filePath}`);
    return false;
  }
}

function checkContent(filePath, pattern, description) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    if (pattern.test(content)) {
      checks.passed.push(`✅ ${description}`);
      return true;
    } else {
      checks.warnings.push(
        `⚠️  ${description} - Pattern not found in ${filePath}`,
      );
      return false;
    }
  } catch (error) {
    checks.failed.push(`❌ ${description} - Error reading ${filePath}`);
    return false;
  }
}

console.log("\n🔍 Running SEO Health Check...\n");

// Check essential files
checkFile(path.join(__dirname, "../public/robots.txt"), "robots.txt exists");

checkFile(path.join(__dirname, "../public/sitemap.xml"), "sitemap.xml exists");

checkFile(path.join(__dirname, "../index.html"), "index.html exists");

// Check meta tags in index.html
const indexPath = path.join(__dirname, "../index.html");
checkContent(indexPath, /<title>.*?<\/title>/, "Title tag present");
checkContent(indexPath, /<meta name="description"/, "Meta description present");
checkContent(indexPath, /<meta name="keywords"/, "Meta keywords present");
checkContent(
  indexPath,
  /<meta property="og:title"/,
  "Open Graph title present",
);
checkContent(
  indexPath,
  /<meta property="og:description"/,
  "Open Graph description present",
);
checkContent(
  indexPath,
  /<meta property="og:image"/,
  "Open Graph image present",
);
checkContent(indexPath, /<meta name="twitter:card"/, "Twitter card present");
checkContent(indexPath, /<link rel="canonical"/, "Canonical URL present");

// Check structured data
checkContent(
  indexPath,
  /"@type":\s*"WebApplication"/,
  "Schema.org WebApplication structured data",
);
checkContent(
  indexPath,
  /"@type":\s*"Organization"/,
  "Schema.org Organization structured data",
);
checkContent(
  indexPath,
  /"@type":\s*"BreadcrumbList"/,
  "Schema.org BreadcrumbList structured data",
);

// Check for noscript content
checkContent(indexPath, /<noscript>/, "Noscript fallback content");

// Check for semantic HTML
checkContent(indexPath, /<h1>/, "H1 heading present in SEO content");
checkContent(indexPath, /<article>/, "Article semantic tag present");

// Check sitemap
const sitemapPath = path.join(__dirname, "../public/sitemap.xml");
checkContent(
  sitemapPath,
  /https:\/\/diagrammatic\.next-zen\.dev/,
  "Sitemap uses correct domain",
);
checkContent(sitemapPath, /<lastmod>2025/, "Sitemap has recent lastmod dates");
checkContent(sitemapPath, /<priority>/, "Sitemap includes priorities");

// Check robots.txt
const robotsPath = path.join(__dirname, "../public/robots.txt");
checkContent(robotsPath, /Sitemap:/, "robots.txt includes sitemap reference");
checkContent(robotsPath, /User-agent: \*/, "robots.txt allows all user agents");

// SEO Recommendations
const recommendations = [
  "📝 Submit sitemap to Google Search Console (https://search.google.com/search-console)",
  "📝 Submit sitemap to Bing Webmaster Tools (https://www.bing.com/webmasters)",
  "🔗 Add backlinks from: Reddit r/systemdesign, Hacker News, Product Hunt, Dev.to",
  "📱 Test mobile-friendliness: https://search.google.com/test/mobile-friendly",
  "⚡ Test page speed: https://pagespeed.web.dev/",
  "🔍 Check indexing status: site:diagrammatic.next-zen.dev in Google",
  "📊 Set up Google Analytics for tracking",
  "🎯 Consider adding a blog for fresh content",
  "🚀 Consider migrating to Next.js for better SSR/SSG support",
  "📄 Add more static pages: /features, /about, /pricing, /use-cases",
];

// Print results
console.log("═══════════════════════════════════════════════════════\n");
console.log(`✅ Passed: ${checks.passed.length}`);
checks.passed.forEach((check) => console.log(check));

console.log(`\n⚠️  Warnings: ${checks.warnings.length}`);
checks.warnings.forEach((check) => console.log(check));

console.log(`\n❌ Failed: ${checks.failed.length}`);
checks.failed.forEach((check) => console.log(check));

console.log("\n═══════════════════════════════════════════════════════");
console.log("\n📋 SEO Recommendations:\n");
recommendations.forEach((rec) => console.log(rec));

console.log("\n═══════════════════════════════════════════════════════\n");

const totalChecks =
  checks.passed.length + checks.warnings.length + checks.failed.length;
const score = Math.round((checks.passed.length / totalChecks) * 100);

console.log(`🎯 SEO Score: ${score}%\n`);

if (score >= 90) {
  console.log("🎉 Excellent! Your SEO setup is great!\n");
} else if (score >= 70) {
  console.log("👍 Good! Address warnings for better SEO.\n");
} else {
  console.log("⚠️  Needs improvement. Address failed checks urgently.\n");
}

process.exit(checks.failed.length > 0 ? 1 : 0);
