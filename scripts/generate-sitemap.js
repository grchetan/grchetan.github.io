import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const catalogPath = path.join(rootDir, "src", "data", "catalog.ts");
const blogPath = path.join(rootDir, "src", "lib", "blog.ts");
const sitemapPath = path.join(rootDir, "public", "sitemap.xml");

// IMPORTANT: Change BASE_URL to "https://grchetan.github.io" when the custom domain chetanprajapat.in expires!
const BASE_URL = "https://www.chetanprajapat.in";

console.log("Generating sitemap.xml...");

const urls = [];

// 1. Core static pages
const CORE_PAGES = [
  { path: "", changefreq: "weekly", priority: "1.0" },
  { path: "about", changefreq: "monthly", priority: "0.8" },
  { path: "projects", changefreq: "weekly", priority: "0.9" },
  { path: "apps", changefreq: "weekly", priority: "0.9" },
  { path: "freelance", changefreq: "weekly", priority: "0.8" },
  { path: "services", changefreq: "monthly", priority: "0.8" },
  { path: "resume", changefreq: "monthly", priority: "0.8" },
  { path: "certificates", changefreq: "monthly", priority: "0.7" },
  { path: "contact", changefreq: "monthly", priority: "0.7" },
  { path: "hire-me", changefreq: "monthly", priority: "0.7" },
  { path: "arcade", changefreq: "weekly", priority: "0.8" },
  { path: "blog", changefreq: "weekly", priority: "0.8" },
];

for (const p of CORE_PAGES) {
  urls.push({
    loc: `${BASE_URL}/${p.path}`,
    changefreq: p.changefreq,
    priority: p.priority,
  });
}

// 2. Dynamic entries from catalog.ts (projects, apps, freelance)
if (fs.existsSync(catalogPath)) {
  const catalogText = fs.readFileSync(catalogPath, "utf8");
  const blocks = catalogText.split("}");
  
  for (const block of blocks) {
    const slugMatch = block.match(/slug:\s*["']([^"']+)["']/);
    const kindMatch = block.match(/kind:\s*["']([^"']+)["']/);
    
    if (slugMatch && kindMatch) {
      const slug = slugMatch[1];
      const kind = kindMatch[1]; // "project" | "app" | "freelance"
      
      let routePrefix = "";
      if (kind === "project") routePrefix = "projects";
      else if (kind === "app") routePrefix = "apps";
      else if (kind === "freelance") routePrefix = "freelance";
      
      if (routePrefix) {
        urls.push({
          loc: `${BASE_URL}/${routePrefix}/${slug}`,
          changefreq: "monthly",
          priority: "0.7",
        });
      }
    }
  }
}

// 3. Dynamic entries from blog.ts (blog posts)
if (fs.existsSync(blogPath)) {
  const blogText = fs.readFileSync(blogPath, "utf8");
  // Match any slug definition inside defaultPosts structure
  const postBlocks = blogText.split("},");
  
  for (const block of postBlocks) {
    const slugMatch = block.match(/slug:\s*["']([^"']+)["']/);
    if (slugMatch) {
      const slug = slugMatch[1];
      // Skip the emptyPost template slug
      if (slug && slug !== "") {
        urls.push({
          loc: `${BASE_URL}/blog/${slug}`,
          changefreq: "monthly",
          priority: "0.7",
        });
      }
    }
  }
}

// Generate XML
const xmlEntries = urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n");

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;

fs.writeFileSync(sitemapPath, sitemapXml, "utf8");
console.log(`Successfully generated sitemap.xml at ${sitemapPath} with ${urls.length} URLs!`);
