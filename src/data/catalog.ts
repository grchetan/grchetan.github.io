import plate01 from "@/assets/plate-01.jpg";
import plate02 from "@/assets/plate-02.jpg";
import plateMobile from "@/assets/plate-mobile.jpg";
import projectGeneric from "@/assets/project-generic.jpg";
import mobileApp from "@/assets/mobile-app.jpg";
import shotApps from "@/assets/shot-apps.jpg";
import shotCommerce from "@/assets/shot-commerce.jpg";
import shotDashboard from "@/assets/shot-dashboard.jpg";
import shotFood from "@/assets/shot-food.jpg";

export type Entry = {
  slug: string;
  title: string;
  kind: "project" | "app" | "freelance";
  tag: string;
  year: string;
  status?: string | undefined;
  summary: string;
  about: string;
  problem: string;
  solution: string;
  result?: string | undefined;
  client?: string | undefined;
  tech: string[];
  features: string[];
  images: string[];
  liveUrl?: string | undefined;
  repoUrl?: string | undefined;
  downloadUrl?: string | undefined;
  downloadLabel?: string | undefined;
  featured?: boolean | undefined;
};

export const fallbackImages = [shotDashboard, plate01, plate02, shotCommerce, projectGeneric];

/* ---------------- personal / product projects ---------------- */

export const projectEntries: Entry[] = [
  {
    slug: "siteready-pro",
    title: "SiteReadyPro",
    kind: "project",
    tag: "Startup",
    year: "2025",
    status: "Startup — founded 2025",
    summary:
      "My own startup, started in 2025: a productised website-building platform where businesses pick a package, brief the work and watch the build progress.",
    about:
      "SiteReadyPro is the startup I founded in 2025 to make professional website delivery predictable. Instead of long back-and-forth quotes, a client chooses a package, answers a structured brief and gets a live build tracker with milestones, previews and invoices in one client portal. I designed the product, the pricing engine and the whole codebase myself.",
    problem:
      "Small businesses could not tell what a website would cost, how long it would take, or what stage it was at. Agencies answered with slow quotes and vague timelines.",
    solution:
      "A package builder with transparent scope and pricing, a guided brief that collects assets and copy up front, and a client portal showing milestone progress, preview links and invoices in real time.",
    result: "Quoting time dropped from days to minutes and every project now runs on a shared, visible timeline.",
    tech: ["React", "TypeScript", "Express.js", "Supabase", "Stripe", "Tailwind CSS"],
    features: ["Package builder", "Guided project brief", "Client portal", "Milestone tracking", "Invoice generation"],
    images: [shotDashboard, plate01],
    featured: true,
  },
  {
    slug: "learning-management-website",
    title: "Learning Management Website",
    kind: "project",
    tag: "Full Stack",
    year: "2025",
    summary: "Course platform with lessons, quizzes, progress tracking and instructor dashboards.",
    about:
      "A full learning platform where instructors publish structured courses and students move through lessons at their own pace. Roles, progress and assessment are all handled server-side, so the same build serves students, instructors and admins from one data model.",
    problem:
      "A tutoring business ran classes over scattered video links and spreadsheets, with no way to see who had actually completed anything.",
    solution:
      "Role-based access with course/lesson modelling, a quiz engine with auto-scoring, and progress analytics per student and per cohort.",
    result: "Course completion visibility went from zero to per-lesson, and admin time on tracking fell dramatically.",
    tech: ["Next.js", "MongoDB", "JWT", "Tailwind CSS"],
    features: ["Role-based access", "Video lessons", "Quiz engine", "Progress analytics", "Certificates"],
    images: [plate01, shotDashboard],
    featured: true,
  },
  {
    slug: "ecommerce-website",
    title: "E-Commerce Website",
    kind: "project",
    tag: "Full Stack",
    year: "2024",
    summary: "Storefront with faceted catalogue, cart, checkout, order history and an inventory back office.",
    about:
      "An end-to-end commerce build: catalogue with faceted search, a persistent cart, coupon-aware checkout, order history for customers and a stock/inventory console for the shop owner.",
    problem: "A retailer wanted to sell online but could not manage stock or coupons without developer help.",
    solution:
      "Normalised product/variant schema, a coupon engine with rules, and an admin console for stock, pricing and orders.",
    result: "The owner now runs sales and stock changes alone, with no code deploys.",
    tech: ["Next.js", "Express.js", "MySQL", "REST API"],
    features: ["Faceted search", "Cart & checkout", "Coupon engine", "Inventory admin", "Order history"],
    images: [shotCommerce, plate02],
    featured: true,
  },
  {
    slug: "admin-dashboard-system",
    title: "Admin Dashboard System",
    kind: "project",
    tag: "Frontend",
    year: "2024",
    summary: "Analytics-first dashboard system with composable widgets, data tables and theme tokens.",
    about:
      "A reusable dashboard shell I use as the starting point for internal tools: composable widgets, virtualised data tables, filter state in the URL and a fully tokenised theme so any brand can be dropped in.",
    problem: "Every internal tool started from scratch, so layout and data-table behaviour were rebuilt each time.",
    solution: "A widget contract plus table primitives, keyboard navigation and token-driven theming.",
    tech: ["React", "TypeScript", "Recharts", "Tailwind CSS"],
    features: ["Composable widgets", "Data tables", "URL filter state", "Theme tokens", "Keyboard nav"],
    images: [shotDashboard, projectGeneric],
  },
  {
    slug: "password-manager",
    title: "Password Manager",
    kind: "project",
    tag: "Full Stack",
    year: "2024",
    summary: "Encrypted credential vault with generator, tagging, search and session lock.",
    about:
      "A vault where secrets are encrypted before they ever leave the browser. The server only ever stores ciphertext, and the session locks itself on inactivity.",
    problem: "Reusing passwords across client projects was a real security risk on shared machines.",
    solution: "AES encryption with a derived key, a strong generator, tag-based search and automatic session lock.",
    tech: ["React", "Node.js", "MongoDB", "Web Crypto"],
    features: ["AES encryption", "Password generator", "Tags & search", "Session lock"],
    images: [plate02, projectGeneric],
  },
  {
    slug: "task-management-app",
    title: "Task Management App",
    kind: "project",
    tag: "Full Stack",
    year: "2024",
    summary: "Realtime kanban workspace with drag ordering, labels, due dates and team activity.",
    about:
      "A collaborative kanban board with realtime sync over sockets, optimistic drag ordering and an activity log so teams can see what moved and when.",
    problem: "A small team tracked work in chat, so nothing had an owner or a due date.",
    solution: "Boards, lists and cards with realtime sync, labels, assignees and an audit trail.",
    tech: ["React", "Node.js", "MongoDB", "Socket.IO"],
    features: ["Kanban board", "Realtime sync", "Labels & filters", "Activity log"],
    images: [projectGeneric, shotDashboard],
  },
  {
    slug: "authentication-system",
    title: "Authentication System",
    kind: "project",
    tag: "Backend",
    year: "2023",
    summary: "Reusable auth service: email + OTP, refresh rotation, roles and password reset.",
    about:
      "A hardened auth service I reuse across builds: email/password and OTP sign-in, refresh-token rotation, role guards and rate limiting on every sensitive route.",
    problem: "Every new project rebuilt auth, and each rebuild introduced new holes.",
    solution: "One audited service with rotation, guards, lockouts and transactional email.",
    tech: ["Express.js", "JWT", "MongoDB", "Nodemailer"],
    features: ["Refresh rotation", "Email OTP", "Role guards", "Rate limiting", "Password reset"],
    images: [plate01, projectGeneric],
  },
  {
    slug: "expense-tracker",
    title: "Expense Tracker",
    kind: "project",
    tag: "Full Stack",
    year: "2023",
    summary: "Personal finance tracker with envelopes, budget alerts and monthly insight charts.",
    about:
      "Budgeting app built around envelopes rather than raw categories, with monthly insight charts, CSV export and an offline cache so entries can be logged anywhere.",
    problem: "Spending reviews happened once a month, far too late to change anything.",
    solution: "Envelope budgets with live alerts, category insights and instant offline entry.",
    tech: ["React", "Supabase", "Recharts"],
    features: ["Budget envelopes", "Alerts", "Category insights", "CSV export", "Offline cache"],
    images: [shotDashboard, plate02],
  },
];

/* ---------------- apps (mobile + mini apps) ---------------- */

export const appEntries: Entry[] = [
  {
    slug: "taskflow",
    title: "TaskFlow",
    kind: "app",
    tag: "Mobile App",
    year: "2025",
    summary: "Offline-first task manager with reminders, streaks and a home-screen widget.",
    about:
      "TaskFlow is a mobile task manager built for people who plan on the move. Everything is stored locally first and synced when a connection appears, so the app never blocks on the network. Streaks and a home-screen widget keep the habit visible.",
    problem:
      "Existing task apps failed on patchy mobile data — taps were lost and reminders fired late or not at all.",
    solution:
      "A local SQLite store as the source of truth with a background sync queue, native scheduled notifications and a widget rendering today's list.",
    result: "Zero lost writes on airplane mode and reminder delivery became reliable.",
    tech: ["React Native", "Expo", "SQLite", "Notifications API"],
    features: ["Offline-first sync", "Smart reminders", "Streaks", "Home-screen widget", "Dark mode"],
    images: [shotApps, plateMobile],
    featured: true,
  },
  {
    slug: "spendwise",
    title: "SpendWise",
    kind: "app",
    tag: "Mobile App",
    year: "2024",
    summary: "Expense tracking with budget envelopes, receipt capture and monthly insight cards.",
    about:
      "SpendWise turns daily spending into a one-tap action. Expenses are logged in under three seconds, receipts are captured with the camera, and monthly insight cards show exactly which envelope broke the budget.",
    problem: "People abandon expense apps because logging a single coffee takes six taps and a form.",
    solution:
      "A quick-add sheet with smart category guessing, camera receipt capture into Firebase Storage and swipeable insight cards.",
    result: "Median logging time fell to about three seconds, so entries actually get made.",
    tech: ["React Native", "Firebase", "Firestore", "Cloud Storage"],
    features: ["Quick-add sheet", "Budget envelopes", "Receipt capture", "Insight cards", "Cloud sync"],
    images: [mobileApp, shotApps],
    featured: true,
  },
  {
    slug: "fittrack",
    title: "FitTrack",
    kind: "app",
    tag: "Mobile App",
    year: "2024",
    summary: "Workout logger with progressive-overload charts, rest timers and plan templates.",
    about:
      "FitTrack logs sets and reps with a thumb-sized keypad, then charts progressive overload per exercise so training decisions are based on real numbers instead of memory.",
    problem: "Paper logs and notes apps made it impossible to see whether lifts were actually progressing.",
    solution: "Per-exercise history with overload charts, auto rest timers and reusable plan templates.",
    tech: ["React Native", "Supabase", "Victory Charts"],
    features: ["Set logging keypad", "Overload charts", "Rest timers", "Plan templates", "Body metrics"],
    images: [plateMobile, shotApps],
    featured: true,
  },
  {
    slug: "weather-app",
    title: "Weather App",
    kind: "app",
    tag: "Mini App",
    year: "2023",
    summary: "Location-aware forecast with an hourly strip and animated conditions.",
    about:
      "A small, fast forecast app: geolocation on load, an hourly scroll strip, a seven-day outlook and animated backdrops that match the current condition.",
    problem: "Most weather sites bury the next few hours under ads and heavy scripts.",
    solution: "One screen, cached API responses and CSS-driven condition animations.",
    tech: ["JavaScript", "REST API", "CSS3"],
    features: ["Geolocation", "Hourly strip", "7-day forecast", "Unit toggle", "Animated states"],
    images: [projectGeneric, shotApps],
  },
  {
    slug: "movie-discovery-app",
    title: "Movie Discovery App",
    kind: "app",
    tag: "Mini App",
    year: "2023",
    summary: "Discovery app over a public movie API with search, genres, trailers and a watchlist.",
    about:
      "A browsing app with debounced search, genre filters, infinite scroll and a persisted watchlist, built to practise clean data-fetching patterns.",
    problem: "Browsing catalogues on slow connections meant constant loading spinners.",
    solution: "Debounced queries, cached pages and skeletons that keep layout stable.",
    tech: ["React", "REST API", "Tailwind CSS"],
    features: ["Debounced search", "Genre filters", "Infinite scroll", "Trailer modal", "Watchlist"],
    images: [shotApps, projectGeneric],
  },
  {
    slug: "focus-clock",
    title: "Focus Clock",
    kind: "app",
    tag: "Mini App",
    year: "2023",
    summary: "Themeable clock with timezones, pomodoro stopwatch and an ambient fullscreen mode.",
    about:
      "A desk companion: multiple timezones, a pomodoro stopwatch and an ambient fullscreen mode designed to sit on a second monitor all day.",
    problem: "Separate tabs for clock, timer and timezone checks broke focus.",
    solution: "One screen with themes, keyboard shortcuts and fullscreen ambient mode.",
    tech: ["JavaScript", "CSS3", "LocalStorage"],
    features: ["Multiple timezones", "Pomodoro stopwatch", "Themes", "Fullscreen mode"],
    images: [projectGeneric, plate02],
  },
];

/* ---------------- freelance / client work ---------------- */

export const freelanceEntries: Entry[] = [
  {
    slug: "virar-special",
    title: "Virar Special",
    kind: "freelance",
    tag: "Food & Delivery",
    year: "2024",
    client: "Virar Special",
    summary: "Food ordering website with a live menu and an owner-facing order console.",
    about:
      "A menu-first ordering site for a local food brand, paired with a console where the owner toggles availability, prices and specials. Orders arrive as structured records instead of free-text messages.",
    problem: "Orders came in as messy WhatsApp texts, with no menu control and frequent mistakes in the kitchen.",
    solution:
      "A fast menu-first site with a structured cart, an owner console for live availability and formatted order handoff to the kitchen.",
    result: "Order errors dropped sharply and average order value rose about 22% in the first two months.",
    tech: ["Next.js", "Node.js", "MongoDB", "Tailwind CSS"],
    features: ["Live menu management", "Structured cart", "Order console", "WhatsApp handoff"],
    images: [shotFood, plate01],
    featured: true,
  },
  {
    slug: "shree-interiors",
    title: "Shree Interiors",
    kind: "freelance",
    tag: "Interior Studio",
    year: "2024",
    client: "Shree Interiors",
    summary: "Portfolio-led studio website with a project gallery and qualified lead capture.",
    about:
      "An interior studio needed their work to feel as premium as their showroom. I built an image-led site with a curated project gallery, a room-type filter and a brief-style enquiry form that qualifies leads before the first call.",
    problem: "Their old site showed low-resolution photos and produced enquiries with no budget or scope.",
    solution:
      "A responsive gallery with art-directed crops, a structured enquiry form capturing budget, timeline and room type, and SEO for local intent.",
    result: "Enquiry quality improved and the studio now shortlists projects before meeting clients.",
    tech: ["React", "Firebase", "Tailwind CSS", "SEO"],
    features: ["Project gallery", "Room-type filter", "Qualified enquiry form", "Local SEO"],
    images: [plate01, shotCommerce],
    featured: true,
  },
  {
    slug: "eduprime-classes",
    title: "EduPrime Classes",
    kind: "freelance",
    tag: "Education",
    year: "2025",
    client: "EduPrime Classes",
    summary: "Coaching website with batch listings, admission enquiries and a results wall.",
    about:
      "A coaching institute wanted parents to find batch details and results without phoning the office. The site publishes batches, fees, faculty and a results wall, and routes admission enquiries straight to the counsellor.",
    problem: "The office spent hours a day answering the same questions about timings and fees.",
    solution: "Self-serve batch and fee pages, a results wall for social proof, and enquiry routing with reminders.",
    result: "Repeat phone questions dropped noticeably and admissions enquiries arrived pre-filled.",
    tech: ["Next.js", "Firebase", "Tailwind CSS"],
    features: ["Batch listings", "Fee tables", "Results wall", "Enquiry routing"],
    images: [plate02, shotDashboard],
    featured: true,
  },
  {
    slug: "restaurant-booking-site",
    title: "Restaurant Booking Site",
    kind: "freelance",
    tag: "Hospitality",
    year: "2023",
    client: "Private client",
    summary: "Reservation-ready restaurant site with menu CMS, gallery and table booking.",
    about:
      "A restaurant site where the menu is editable by staff, tables can be booked in a few taps, and the gallery loads instantly on mobile data.",
    problem: "Bookings were taken by phone during service, and the printed menu never matched the website.",
    solution: "A menu CMS the staff control, a table-booking flow with slot limits and Google Maps directions.",
    result: "Walk-in confusion fell and weekend bookings shifted mostly online.",
    tech: ["React", "Firebase", "Tailwind CSS"],
    features: ["Table booking", "Menu CMS", "Gallery", "Maps & directions"],
    images: [shotFood, projectGeneric],
  },
];

export const allEntries = [...projectEntries, ...appEntries, ...freelanceEntries];

export function entriesFor(kind: Entry["kind"]) {
  return allEntries.filter((e) => e.kind === kind);
}

export function findEntry(kind: Entry["kind"], slug: string) {
  return allEntries.find((e) => e.kind === kind && e.slug === slug);
}
