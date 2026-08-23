export const profile = {
  name: "Chetan Prajapat",
  roles: ["Full Stack Web Developer", "UI Engineer", "Freelancer"],
  tagline:
    "I build modern, scalable and high-performance websites and web applications that help businesses grow.",
  email: "contact.chetanprajapat@gmail.com",
  socials: {
    github: "https://github.com/grchetan",
    linkedin: "https://www.linkedin.com/in/chetan-prajapat-58350b285/",
    instagram: "https://www.instagram.com/chetanprajapat_/",
    facebook: "https://www.facebook.com/profile.php?id=100030457882324",
    twitter: "https://twitter.com/grchetann",
    leetcode: "https://leetcode.com/u/chetanprajapat07/",
    codechef: "https://www.codechef.com/users/grchetan",
    hackerrank: "https://www.hackerrank.com/profile/chetanprajapat",
  },
};

export const aboutParagraphs = [
  "I'm a passionate Full Stack Developer who loves building modern web applications with beautiful user experiences.",
  "I specialize in creating fast, responsive and scalable websites using modern technologies — from pixel-precise interfaces to production APIs.",
  "I enjoy solving real-world problems, building SaaS products, business websites, admin dashboards, and custom web applications.",
];

export const aboutStats = [
  { label: "Experience", value: 3, suffix: "+ yrs" },
  { label: "Projects Completed", value: 40, suffix: "+" },
  { label: "Freelance Clients", value: 14, suffix: "+" },
  { label: "Certificates", value: 18, suffix: "" },
  { label: "Years Learning", value: 5, suffix: "" },
  { label: "LeetCode Solved", value: 219, suffix: "+" },
  { label: "GitHub Contributions", value: 1200, suffix: "+" },
];

export const techStack = [
  {
    category: "Languages",
    items: ["Java", "JavaScript", "HTML5", "CSS3"],
  },
  {
    category: "Frontend",
    items: [
      "React",
      "JavaScript",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
    ],
  },
  { category: "Backend", items: ["Node.js", "Express.js", "Java"] },
  { category: "Database", items: ["MongoDB", "MySQL", "Firebase", "Supabase"] },
  {
    category: "Tools & OS",
    items: ["Linux (Kali Linux)", "Git", "GitHub", "VS Code", "Postman", "Figma", "Vercel", "Netlify"],
  },
  {
    category: "Other",
    items: [
      "REST API",
      "JWT",
      "Authentication",
      "Responsive Design",
      "SEO",
      "Performance Optimization",
    ],
  },
];

export const services = [
  { title: "Website Development", desc: "Custom, hand-built websites engineered for speed and scale." },
  { title: "Landing Pages", desc: "High-converting pages with sharp copy layout and motion." },
  { title: "Business Websites", desc: "Credible, SEO-ready presence for growing companies." },
  { title: "Portfolio Websites", desc: "Personal brands that recruiters actually remember." },
  { title: "Dashboard Development", desc: "Data-dense admin panels with clean information design." },
  { title: "Frontend Development", desc: "Accessible component systems in React and TypeScript." },
  { title: "Backend Development", desc: "Node APIs, auth, jobs and clean database modelling." },
  { title: "Full Stack Applications", desc: "End-to-end product builds from schema to ship." },
  { title: "Website Redesign", desc: "Modernise dated UI without losing your SEO equity." },
  { title: "API Integration", desc: "Payments, mail, maps, AI and third-party services." },
  { title: "Performance Optimization", desc: "Core Web Vitals work that moves real numbers." },
  { title: "Bug Fixing", desc: "Rapid diagnosis and durable fixes, not band-aids." },
  { title: "Firebase Integration", desc: "Auth, Firestore, storage and hosting wired properly." },
  { title: "Supabase Integration", desc: "Postgres, RLS policies, storage and edge logic." },
  { title: "Deployment", desc: "CI, domains, SSL and zero-downtime releases." },
  { title: "Website Maintenance", desc: "Ongoing care plans, monitoring and improvements." },
];

export type Project = {
  title: string;
  category: "Full Stack" | "Frontend" | "Freelance" | "Mini App";
  description: string;
  tech: string[];
  features: string[];
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: "Portfolio Website",
    category: "Frontend",
    description:
      "This very portfolio — a motion-led personal site with glass UI, command menu and a hand-rolled design system.",
    tech: ["React", "TypeScript", "Tailwind CSS", "Motion"],
    features: ["Custom design system", "Command palette", "Scroll-linked motion", "Perfect Lighthouse targets"],
    featured: true,
  },
  {
    title: "Virar Special",
    category: "Freelance",
    description:
      "Local food & delivery brand experience with menu browsing, cart flow and an owner-facing order console.",
    tech: ["Next.js", "Node.js", "MongoDB", "Tailwind CSS"],
    features: ["Live menu management", "Order tracking", "Admin console", "WhatsApp order handoff"],
    featured: true,
  },
  {
    title: "SiteReadyPro",
    category: "Full Stack",
    description:
      "A productised web-agency platform where clients pick a package, brief the project and track build progress.",
    tech: ["React", "Express.js", "Supabase", "Stripe"],
    features: ["Package builder", "Client portal", "Milestone tracking", "Invoice generation"],
    featured: true,
  },
  {
    title: "Learning Management Website",
    category: "Full Stack",
    description: "Course platform with lessons, progress tracking, quizzes and instructor dashboards.",
    tech: ["Next.js", "MongoDB", "JWT", "Tailwind CSS"],
    features: ["Role-based access", "Video lessons", "Quiz engine", "Progress analytics"],
    featured: true,
  },
  {
    title: "Password Manager App",
    category: "Full Stack",
    description: "Encrypted vault for credentials with generator, tagging and one-click copy.",
    tech: ["React", "Node.js", "MongoDB", "Crypto"],
    features: ["AES encryption", "Password generator", "Search & tags", "Session lock"],
  },
  {
    title: "E-Commerce Website",
    category: "Full Stack",
    description: "Storefront with catalogue, cart, checkout, order history and an inventory back office.",
    tech: ["Next.js", "Express.js", "MySQL", "REST API"],
    features: ["Faceted search", "Cart & checkout", "Coupon engine", "Inventory admin"],
    featured: true,
  },
  {
    title: "Admin Dashboard",
    category: "Frontend",
    description: "Analytics-first dashboard template with charts, tables, filters and dark mode.",
    tech: ["React", "TypeScript", "Recharts", "Tailwind CSS"],
    features: ["Composable widgets", "Data tables", "Theme tokens", "Keyboard nav"],
  },
  {
    title: "Restaurant Website",
    category: "Freelance",
    description: "Reservation-ready restaurant site with menu, gallery and table booking.",
    tech: ["React", "Firebase", "Tailwind CSS"],
    features: ["Table booking", "Menu CMS", "Gallery", "Google Maps"],
  },
  {
    title: "Business Landing Page",
    category: "Frontend",
    description: "Conversion-focused single page with lead capture and analytics events.",
    tech: ["Next.js", "Tailwind CSS", "SEO"],
    features: ["Lead form", "A/B ready sections", "Schema markup", "98+ PageSpeed"],
  },
  {
    title: "Task Management App",
    category: "Full Stack",
    description: "Kanban workspace with drag-ordered lists, labels, due dates and team members.",
    tech: ["React", "Node.js", "MongoDB", "Socket.IO"],
    features: ["Kanban board", "Realtime sync", "Labels & filters", "Activity log"],
  },
  {
    title: "Authentication System",
    category: "Full Stack",
    description: "Reusable auth service: email, OTP, refresh tokens, roles and password reset.",
    tech: ["Express.js", "JWT", "MongoDB", "Nodemailer"],
    features: ["Refresh rotation", "Email OTP", "Role guards", "Rate limiting"],
  },
  {
    title: "Expense Tracker",
    category: "Full Stack",
    description: "Personal finance tracker with categories, budgets and monthly insight charts.",
    tech: ["React", "Supabase", "Recharts"],
    features: ["Budget alerts", "Category insights", "CSV export", "Offline cache"],
  },
  {
    title: "Movie App",
    category: "Frontend",
    description: "Discovery app over a public movie API with search, genres and watchlist.",
    tech: ["React", "REST API", "Tailwind CSS"],
    features: ["Infinite scroll", "Watchlist", "Trailer modal", "Debounced search"],
  },
  {
    title: "Weather App",
    category: "Mini App",
    description: "Location-aware forecast with hourly strip and animated conditions.",
    tech: ["JavaScript", "REST API", "CSS3"],
    features: ["Geolocation", "7-day forecast", "Unit toggle", "Animated states"],
  },
  {
    title: "Todo App",
    category: "Mini App",
    description: "Minimal task list with persistence, filters and keyboard-first flow.",
    tech: ["React", "LocalStorage"],
    features: ["Keyboard shortcuts", "Filters", "Persistence", "Drag reorder"],
  },
  {
    title: "Calculator",
    category: "Mini App",
    description: "Keyboard-driven calculator with expression history.",
    tech: ["JavaScript", "CSS3"],
    features: ["Expression parser", "History", "Keyboard input", "Responsive keypad"],
  },
  {
    title: "Digital Clock",
    category: "Mini App",
    description: "Themeable clock with timezones, stopwatch and ambient background.",
    tech: ["JavaScript", "CSS3"],
    features: ["Multiple timezones", "Stopwatch", "Themes", "Fullscreen mode"],
  },
];

export const projectCategories = ["All", "Full Stack", "Frontend", "Freelance", "Mini App"] as const;

export const freelanceWork = [
  {
    client: "Virar Special",
    project: "Food ordering website & order console",
    problem: "Orders arrived as messy WhatsApp texts, with no menu control and frequent mistakes.",
    solution:
      "Built a fast menu-first site with structured cart, an owner console for live availability and formatted order handoff.",
    result: "Order errors dropped sharply and average order value rose ~22% in the first two months.",
    tech: ["Next.js", "Node.js", "MongoDB", "Tailwind CSS"],
    testimonial:
      "Chetan understood our shop better than we explained it. The site is quick, and staff learned the console in a day.",
  },
  {
    client: "Shree Interiors",
    project: "Business website & lead funnel",
    problem: "A dated one-pager that ranked nowhere and produced almost no enquiries.",
    solution: "Rebuilt with a project gallery, service pages, schema markup and a tracked enquiry form.",
    result: "Organic enquiries went from ~2 to 18 a month within a quarter.",
    tech: ["React", "Firebase", "SEO", "Tailwind CSS"],
    testimonial: "We finally look like the quality of work we deliver. Enquiries speak for themselves.",
  },
  {
    client: "EduPrime Classes",
    project: "Learning portal & admin dashboard",
    problem: "Course material was spread across drive links with no visibility into student progress.",
    solution: "Delivered a lesson portal with progress tracking, quizzes and an instructor dashboard.",
    result: "Course completion improved 34% and admin time per batch halved.",
    tech: ["Next.js", "Supabase", "JWT", "Recharts"],
    testimonial: "Clear communication, weekly demos, zero surprises. Exactly how a build should go.",
  },
];

export const mobileApps = [
  {
    name: "TaskFlow",
    desc: "Offline-first task manager with reminders, streaks and widget support.",
    tech: ["React Native", "Expo", "SQLite"],
  },
  {
    name: "SpendWise",
    desc: "Expense tracking with budget envelopes and monthly insight cards.",
    tech: ["React Native", "Firebase"],
  },
  {
    name: "FitTrack",
    desc: "Workout logger with progressive overload charts and rest timers.",
    tech: ["React Native", "Supabase"],
  },
];

export const certificates = [
  {
    title: "C Programming",
    issuer: "Sunstone School of Technology",
    year: "2025",
    category: "C Programming",
    link: "https://sunstone.in/certificate?id=2ee2a282-2e84-4dd2-8eef-127b4ae15053",
  },
  {
    title: "Cursor AI: VibeCode Mastery",
    issuer: "Sunstone School of Technology",
    year: "2025",
    category: "AI & Development",
    link: "https://sunstone.in/certificate?id=2ee2a282-2e84-4dd2-8eef-127b4ae15053",
  },
  {
    title: "Introduction to SQL",
    issuer: "Cognitive Class",
    year: "2025",
    category: "Database",
    link: "https://cognitiveclass.ai/courses/learn-sql-relational-databases",
  },
  {
    title: "Introduction to Cloud",
    issuer: "Cognitive Class",
    year: "2025",
    category: "Cloud Computing",
    link: "https://cognitiveclass.ai/courses/introduction-to-cloud",
  },
  {
    title: "Introduction to Open Source",
    issuer: "Sunstone School of Technology",
    year: "2025",
    category: "Open Source",
    link: "https://sunstone.in/certificate?id=2ee2a282-2e84-4dd2-8eef-127b4ae15053",
  },
  {
    title: "Full Stack Web Development",
    issuer: "Devfolio",
    year: "2025",
    category: "Full Stack Development",
  },
  {
    title: "Prompt Engineering for Everyone",
    issuer: "Cognitive Class",
    year: "2025",
    category: "AI & Prompting",
  },
  {
    title: "Web Development Masterclass",
    issuer: "Udemy",
    year: "2025",
    category: "Web Development",
  },
  {
    title: "1 Minute Typing Test",
    issuer: "Typing.com",
    year: "2026",
    category: "Typing",
    link: "https://www.typing.com/student/verify#40136222-162755906",
  },
];

export const experience = [
  {
    period: "2025 — Present",
    role: "Freelance Full Stack Developer",
    org: "Self-employed",
    kind: "Freelancing",
    points: [
      "Shipping production websites and dashboards for Indian SMBs and founders.",
      "Own the full cycle: scoping, design, build, deployment and maintenance.",
    ],
  },
  {
    period: "2024 — 2025",
    role: "Web Development Intern",
    org: "Product startup",
    kind: "Internship",
    points: [
      "Built reusable React component libraries and cut bundle size 28%.",
      "Integrated REST APIs, auth flows and analytics instrumentation.",
    ],
  },
  {
    period: "2024",
    role: "Hackathon Finalist",
    org: "Smart India Hackathon",
    kind: "Hackathons",
    points: [
      "Led frontend for a civic-reporting platform built in 36 hours.",
      "Finished in the top bracket among 200+ competing teams.",
    ],
  },
  {
    period: "2023 — 2024",
    role: "Open Source Contributor",
    org: "GitHub community",
    kind: "Open Source",
    points: [
      "Merged fixes and docs into React and Tailwind ecosystem repos.",
      "Maintain small utility packages used by other student developers.",
    ],
  },
  {
    period: "2021 — 2023",
    role: "Self-taught Developer",
    org: "Personal journey",
    kind: "Personal Journey",
    points: [
      "Went from static HTML pages to full stack apps through daily practice.",
      "Built 25+ practice projects while solving DSA problems consistently.",
    ],
  },
];

export const achievements = [
  { label: "Projects Completed", value: 40, suffix: "+" },
  { label: "Certificates", value: 18, suffix: "" },
  { label: "Happy Clients", value: 14, suffix: "+" },
  { label: "GitHub Repositories", value: 62, suffix: "" },
  { label: "LeetCode Problems", value: 219, suffix: "+" },
  { label: "Coding Hours", value: 4800, suffix: "+" },
  { label: "Open Source Contributions", value: 35, suffix: "+" },
];

export const codingProfiles = [
  {
    platform: "GitHub",
    username: "@grchetan",
    stat: "Public Repositories",
    meta: "Active profile",
    badges: ["Developer", "Open Source"],
    url: profile.socials.github,
  },
  {
    platform: "LeetCode",
    username: "@chetanprajapat07",
    stat: "219+ solved",
    meta: "Active coder",
    badges: ["Problem Solving", "DSA"],
    url: profile.socials.leetcode,
  },
  {
    platform: "CodeChef",
    username: "@grchetan",
    stat: "Competitive Coder",
    meta: "Contest participant",
    badges: ["Problem Solving"],
    url: profile.socials.codechef,
  },
  {
    platform: "HackerRank",
    username: "@chetanprajapat",
    stat: "Problem Solving",
    meta: "JavaScript & Algorithms",
    badges: ["JS Verified", "Problem Solving"],
    url: profile.socials.hackerrank,
  },
  {
    platform: "LinkedIn",
    username: "in/chetan-prajapat",
    stat: "Professional Profile",
    meta: "Open to work",
    badges: ["Full Stack Developer"],
    url: profile.socials.linkedin,
  },
];

export const githubLanguages = [
  { name: "JavaScript", pct: 45 },
  { name: "Java", pct: 25 },
  { name: "HTML", pct: 18 },
  { name: "CSS", pct: 12 },
];

export const githubActivity = [
  "Pushed commits to grchetan/bhagwat-gita",
  "Updated grchetan/ai-assistant repository",
  "Pushed updates to grchetan/ai-video",
  "Built and deployed full stack portfolio project",
];

export const pinnedRepos = [
  { name: "bhagwat-gita", desc: "Bhagwat Gita web experience with Sanskrit slokas & translations", lang: "TypeScript" },
  { name: "ai-assistant", desc: "AI assistant integration powered by LLMs", lang: "Python" },
  { name: "ai-video", desc: "AI video generation & processing workspace", lang: "HTML" },
  { name: "backend-learning", desc: "Backend API routes, auth & database architecture practice", lang: "JavaScript" },
];

export const testimonials = [
  {
    name: "Kamlesh Prajapati",
    role: "Founder, Virar Special",
    quote:
      "Our site went from an afterthought to our main sales channel. Fast, clean and exactly on brief.",
  },
  {
    name: "Anjali Mehta",
    role: "Founder, Shree Interiors",
    quote:
      "Chetan asked the right questions before writing a line of code. The result feels premium and converts.",
  },
  {
    name: "Karan Patel",
    role: "Director, EduPrime Classes",
    quote: "Weekly demos, clear timelines, and support after launch. Rare combination for this budget.",
  },
  {
    name: "Sneha Verma",
    role: "Product Manager",
    quote: "He shipped the dashboard two weeks early and the code review notes were genuinely useful.",
  },
];

export const processSteps = [
  { step: "01", title: "Discovery", desc: "Understand the business, users and the actual metric we need to move." },
  { step: "02", title: "Planning", desc: "Scope, sitemap, data model and a milestone timeline you can hold me to." },
  { step: "03", title: "Design", desc: "Wireframes to a polished, token-driven UI system in Figma." },
  { step: "04", title: "Development", desc: "Clean, typed, reusable code with weekly demo builds." },
  { step: "05", title: "Testing", desc: "Cross-device QA, accessibility passes and performance budgets." },
  { step: "06", title: "Deployment", desc: "Domains, SSL, analytics, SEO and a zero-downtime release." },
  { step: "07", title: "Support", desc: "Post-launch care, monitoring and iteration as you grow." },
];

export const whyHireMe = [
  { title: "Clean Code", desc: "Typed, reviewed and readable — easy for the next developer." },
  { title: "Responsive", desc: "Mobile-first layouts tested from 320px to ultrawide." },
  { title: "Fast Delivery", desc: "Milestone-based shipping with weekly visible progress." },
  { title: "SEO Friendly", desc: "Semantic markup, metadata, schema and clean URLs." },
  { title: "Scalable Architecture", desc: "Modular structure that survives feature growth." },
  { title: "Modern UI", desc: "Design-system driven interfaces with real craft." },
  { title: "Bug Free", desc: "Edge cases handled and validated on both ends." },
  { title: "Long Term Support", desc: "I stay reachable long after handover." },
];

export const education = [
  {
    degree: "Bachelor of Computer Application (BCA)",
    school: "Sage University Indore — powered by Sunstone",
    years: "2024 – 2027",
    note: "Core CS, web engineering and data structures, alongside industry training tracks.",
  },
  {
    degree: "Class XII — Commerce",
    school: "Keshav International School",
    years: "2023 – 2024",
    note: "Finished school while shipping my first freelance websites on the side.",
  },
  {
    degree: "Class X",
    school: "Keshav International School",
    years: "2020 – 2021",
    note: "Where the first HTML page happened — and never stopped.",
  },
  {
    degree: "Computer Institute — Diploma track",
    school: "Rebenok Infotech",
    years: "Foundation",
    note: "Computer fundamentals, office tooling and typing speed groundwork.",
  },
];
