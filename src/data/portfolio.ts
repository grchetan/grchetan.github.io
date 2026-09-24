export const profile = {
  name: "Chetan Prajapat",
  roles: ["Full Stack Web Developer", "UI Engineer", "Freelancer"],
  tagline:
    "I build modern, scalable, and high-performance websites and web applications that help businesses grow.",
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
  "I am a Full Stack Developer specializing in building modern, responsive, and high-performance web applications.",
  "I work across the entire stack using React, JavaScript, Node.js, Express.js, MongoDB, and SQL to build intuitive user interfaces and reliable backend APIs.",
  "I have built over 40 projects and worked with 14 freelance clients, delivering custom websites, SaaS platforms, and admin dashboards with clean code and great performance.",
];

export const aboutStats = [
  { label: "Experience", value: 3, suffix: "+ yrs" },
  { label: "Projects Completed", value: 40, suffix: "+" },
  { label: "Freelance Clients", value: 14, suffix: "+" },
  { label: "Certificates", value: 18, suffix: "" },
  { label: "Years Learning", value: 5, suffix: "" },
  { label: "LeetCode Solved", value: 242, suffix: "+" },
  { label: "GitHub Contributions", value: 1200, suffix: "+" },
];

export const techStack = [
  {
    category: "Programming Languages",
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
  { category: "Databases", items: ["MongoDB", "MySQL", "Firebase", "Supabase"] },
  {
    category: "Tools & Platforms",
    items: ["Linux (Kali Linux)", "Git", "GitHub", "VS Code", "Postman", "Figma", "Vercel", "Netlify"],
  },
  {
    category: "Other Skills",
    items: [
      "REST APIs",
      "JWT",
      "Authentication",
      "Responsive Design",
      "SEO",
      "Performance Optimization",
    ],
  },
];

export const services = [
  { title: "Website Development", desc: "Custom, high-performance websites built for responsiveness and scale." },
  { title: "Landing Pages", desc: "High-converting landing pages with modern design and clear calls to action." },
  { title: "Business Websites", desc: "Professional, SEO-friendly websites that establish credibility for businesses." },
  { title: "Portfolio Websites", desc: "Modern portfolio websites that showcase skills and projects effectively." },
  { title: "Dashboard Development", desc: "Custom admin dashboards with interactive charts and clean data management." },
  { title: "Frontend Development", desc: "Responsive, accessible frontend development using React and modern CSS." },
  { title: "Backend Development", desc: "Secure REST APIs, user authentication, and optimized database architecture using Node.js." },
  { title: "Full Stack Applications", desc: "End-to-end full stack web applications from database design to production deployment." },
  { title: "Website Redesign", desc: "Modernizing outdated websites with improved UI, mobile responsiveness, and SEO." },
  { title: "API Integration", desc: "Seamless integration of third-party APIs, payment gateways, and cloud services." },
  { title: "Performance Optimization", desc: "Improving page load speed, responsiveness, and Core Web Vitals scores." },
  { title: "Bug Fixing & Support", desc: "Troubleshooting and resolving front-end, backend, and database issues." },
  { title: "Firebase Integration", desc: "Setting up authentication, Firestore database, cloud storage, and hosting." },
  { title: "Supabase Integration", desc: "Configuring PostgreSQL databases, authentication, and secure row-level security policies." },
  { title: "Deployment & DevOps", desc: "Domain configuration, SSL setup, and continuous deployment on Vercel and Netlify." },
  { title: "Website Maintenance", desc: "Regular updates, bug fixes, performance monitoring, and ongoing technical support." },
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
      "A modern developer portfolio featuring dark mode, interactive animations, and live GitHub and LeetCode API integrations.",
    tech: ["React", "TypeScript", "Tailwind CSS", "Motion"],
    features: ["Responsive design", "Theme toggle", "Live API stats", "Interactive showcase"],
    featured: true,
  },
  {
    title: "Virar Special",
    category: "Freelance",
    description:
      "A food ordering web app and admin management console built for a local food brand, enabling direct customer orders.",
    tech: ["Next.js", "Node.js", "MongoDB", "Tailwind CSS"],
    features: ["Live menu management", "Order tracking", "Admin console", "WhatsApp order sharing"],
    featured: true,
  },
  {
    title: "SiteReadyPro",
    category: "Full Stack",
    description:
      "A web agency service platform where clients select website packages, submit project requirements, and track development milestones.",
    tech: ["React", "Express.js", "Supabase", "Stripe"],
    features: ["Package selection", "Client dashboard", "Project tracking", "Invoicing system"],
    featured: true,
  },
  {
    title: "Learning Management Website",
    category: "Full Stack",
    description: "An online learning platform with video lessons, quiz assessments, student progress tracking, and instructor dashboards.",
    tech: ["Next.js", "MongoDB", "JWT", "Tailwind CSS"],
    features: ["Role-based access", "Video lessons", "Quiz engine", "Progress analytics"],
    featured: true,
  },
  {
    title: "Password Manager App",
    category: "Full Stack",
    description: "A secure credential storage application with encrypted vaults, password generator, category tagging, and one-click copy.",
    tech: ["React", "Node.js", "MongoDB", "Crypto"],
    features: ["AES encryption", "Password generator", "Search & tags", "Session security"],
  },
  {
    title: "E-Commerce Website",
    category: "Full Stack",
    description: "A full-featured e-commerce platform with product catalogue, search filters, shopping cart, checkout, and admin inventory controls.",
    tech: ["Next.js", "Express.js", "MySQL", "REST API"],
    features: ["Product search & filters", "Cart & checkout", "Discount coupons", "Inventory management"],
    featured: true,
  },
  {
    title: "Admin Dashboard",
    category: "Frontend",
    description: "An analytics dashboard featuring data visualization charts, customizable tables, filter options, and dark mode support.",
    tech: ["React", "TypeScript", "Recharts", "Tailwind CSS"],
    features: ["Interactive charts", "Data tables", "Theme customization", "Responsive layout"],
  },
  {
    title: "Restaurant Website",
    category: "Freelance",
    description: "A modern restaurant website featuring digital food menus, image gallery, customer reviews, and table reservation booking.",
    tech: ["React", "Firebase", "Tailwind CSS"],
    features: ["Table reservations", "Digital menu", "Photo gallery", "Location maps"],
  },
  {
    title: "Business Landing Page",
    category: "Frontend",
    description: "A conversion-focused business landing page optimized for lead generation, SEO ranking, and fast loading speeds.",
    tech: ["Next.js", "Tailwind CSS", "SEO"],
    features: ["Lead capture form", "SEO optimization", "Fast loading times", "Mobile responsiveness"],
  },
  {
    title: "Task Management App",
    category: "Full Stack",
    description: "A collaborative task management application featuring Kanban boards, drag-and-drop task organization, and due date alerts.",
    tech: ["React", "Node.js", "MongoDB", "Socket.IO"],
    features: ["Kanban boards", "Realtime sync", "Category labels", "Activity log"],
  },
  {
    title: "Authentication System",
    category: "Full Stack",
    description: "A secure backend authentication system featuring JWT tokens, password hashing, email verification, and role-based access control.",
    tech: ["Express.js", "JWT", "MongoDB", "Nodemailer"],
    features: ["Token refresh", "Email verification", "Role guards", "Rate limiting"],
  },
  {
    title: "Expense Tracker",
    category: "Full Stack",
    description: "A personal finance tracking tool to monitor daily expenses, set budget limits, and visualize spending patterns through charts.",
    tech: ["React", "Supabase", "Recharts"],
    features: ["Budget alerts", "Category insights", "CSV export", "Offline caching"],
  },
  {
    title: "Movie App",
    category: "Frontend",
    description: "A movie discovery application consuming public movie APIs to browse trending titles, search by genre, and create personal watchlists.",
    tech: ["React", "REST API", "Tailwind CSS"],
    features: ["Movie search", "Genre filters", "Watchlist management", "Detailed movie info"],
  },
  {
    title: "Weather App",
    category: "Mini App",
    description: "A weather application providing real-time forecasts, 7-day outlooks, and location search using external weather APIs.",
    tech: ["JavaScript", "REST API", "CSS3"],
    features: ["Geolocation support", "7-day forecast", "Weather animations", "Temperature unit toggle"],
  },
  {
    title: "Todo App",
    category: "Mini App",
    description: "A clean productivity app to create, edit, filter, and organize tasks with local storage persistence.",
    tech: ["React", "LocalStorage"],
    features: ["Task filtering", "Local storage sync", "Clean interface", "Keyboard support"],
  },
  {
    title: "Calculator",
    category: "Mini App",
    description: "An interactive web calculator supporting standard arithmetic calculations and calculation history tracking.",
    tech: ["JavaScript", "CSS3"],
    features: ["Arithmetic operations", "Calculation history", "Responsive keypad", "Keyboard inputs"],
  },
  {
    title: "Digital Clock",
    category: "Mini App",
    description: "A digital clock application featuring world timezones, stopwatch, and multiple visual display themes.",
    tech: ["JavaScript", "CSS3"],
    features: ["Multiple timezones", "Stopwatch tool", "Theme options", "Full-screen mode"],
  },
];

export const projectCategories = ["All", "Full Stack", "Frontend", "Freelance", "Mini App"] as const;

export const freelanceWork = [
  {
    client: "Virar Special",
    project: "Food ordering website & order console",
    problem: "Orders were received manually via WhatsApp, leading to menu confusion and order errors.",
    solution:
      "Built an online ordering website with digital menu, shopping cart, and an admin console to manage orders.",
    result: "Reduced order mistakes significantly and increased average order value by 22%.",
    tech: ["Next.js", "Node.js", "MongoDB", "Tailwind CSS"],
    testimonial:
      "Chetan understood our shop better than we explained it. The site is quick, and staff learned the console in a day.",
  },
  {
    client: "Shree Interiors",
    project: "Business website & lead funnel",
    problem: "Outdated single-page website with poor search visibility and few customer inquiries.",
    solution: "Developed a modern multi-page portfolio with project showcase, SEO optimization, and an inquiry contact form.",
    result: "Increased organic monthly inquiries from 2 to 18 within three months.",
    tech: ["React", "Firebase", "SEO", "Tailwind CSS"],
    testimonial: "We finally look like the quality of work we deliver. Enquiries speak for themselves.",
  },
  {
    client: "EduPrime Classes",
    project: "Learning portal & admin dashboard",
    problem: "Course materials were scattered across external links with no way to track student progress.",
    solution: "Created a structured learning portal with student progress tracking, quizzes, and an instructor dashboard.",
    result: "Improved course completion rate by 34% and reduced administrative overhead by 50%.",
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

export type WorkExperience = {
  company: string;
  role: string;
  duration: string;
  technologies: string[];
  description: string;
  badge?: string;
  current?: boolean;
};

export const workExperiences: WorkExperience[] = [
  {
    company: "Grow Local Business",
    role: "Full Stack Web Development Intern",
    duration: "June 2026 – Present",
    current: true,
    badge: "Current Internship",
    technologies: ["HTML/CSS", "Node.js", "JavaScript", "SEO", "Supabase"],
    description:
      "Gained practical experience in full-stack development, UI design, and teamwork during internship.",
  },
  {
    company: "Freelance Web Developer",
    role: "Freelance Web Developer",
    duration: "Nov 2024 – May 2026",
    badge: "Client Projects",
    technologies: ["HTML", "CSS", "JavaScript", "React", "Node.js", "Supabase"],
    description:
      "Managed project deployment and delivered user-focused web solutions based on project requirements.",
  },
  {
    company: "Rebenok Infotech",
    role: "Web Design / UI & Graphic Design",
    duration: "May 2022 – Aug 2023",
    badge: "Design & Fundamentals",
    technologies: ["Web Design", "CSS", "UI Design", "Graphic Design"],
    description:
      "Worked on website design and learned practical web design principles and development workflows.",
  },
];

export const experience = [
  {
    period: "2025 — Present",
    role: "Freelance Full Stack Developer",
    org: "Self-employed",
    kind: "Freelancing",
    points: [
      "Building and deploying production web applications and dashboards for clients.",
      "Managing complete project lifecycles from design to deployment and maintenance.",
    ],
  },
  {
    period: "2024 — 2025",
    role: "Web Development Intern",
    org: "Product startup",
    kind: "Internship",
    points: [
      "Built reusable React components and optimized application bundle size.",
      "Integrated REST APIs, user authentication, and performance analytics.",
    ],
  },
  {
    period: "2024",
    role: "Hackathon Finalist",
    org: "Smart India Hackathon",
    kind: "Hackathons",
    points: [
      "Led frontend development for a civic-reporting platform within 36 hours.",
      "Ranked in top finalist teams among 200+ competing colleges.",
    ],
  },
  {
    period: "2023 — 2024",
    role: "Open Source Contributor",
    org: "GitHub community",
    kind: "Open Source",
    points: [
      "Contributed bug fixes and documentation to open source React libraries.",
      "Created utility repositories and starter templates for student developers.",
    ],
  },
  {
    period: "2021 — 2023",
    role: "Self-taught Developer",
    org: "Personal journey",
    kind: "Personal Journey",
    points: [
      "Learned full-stack web development through structured daily coding practice.",
      "Built 25+ practice projects while actively solving data structures and algorithms.",
    ],
  },
];

export const achievements = [
  { label: "Projects Completed", value: 40, suffix: "+" },
  { label: "Certificates", value: 18, suffix: "" },
  { label: "Happy Clients", value: 14, suffix: "+" },
  { label: "GitHub Repositories", value: 62, suffix: "" },
  { label: "LeetCode Problems", value: 229, suffix: "+" },
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
    stat: "229+ solved",
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
  { step: "01", title: "Discovery", desc: "Understand project goals, user requirements, and key deliverables." },
  { step: "02", title: "Planning", desc: "Define project scope, architecture, milestones, and delivery timeline." },
  { step: "03", title: "Design", desc: "Create clean wireframes and modern UI mockups in Figma." },
  { step: "04", title: "Development", desc: "Build full-stack features using clean, maintainable, and modern code." },
  { step: "05", title: "Testing", desc: "Test across devices and browsers for performance, responsiveness, and stability." },
  { step: "06", title: "Deployment", desc: "Deploy to production with domain setup, SSL, and SEO optimization." },
  { step: "07", title: "Support", desc: "Provide maintenance, bug fixes, and feature updates after launch." },
];

export const whyHireMe = [
  { title: "Clean Code", desc: "Clean, well-structured, and easy to maintain." },
  { title: "Responsive Design", desc: "Mobile-first layouts tested across all screen sizes." },
  { title: "Fast Delivery", desc: "Milestone-based progress with transparent, regular updates." },
  { title: "SEO Friendly", desc: "Semantic markup, clean metadata, and search-friendly URLs." },
  { title: "Scalable Architecture", desc: "Modular structure ready for future features and traffic growth." },
  { title: "Modern UI/UX", desc: "Intuitive, clean, and engaging user experiences." },
  { title: "Reliable & Bug-Free", desc: "Thoroughly tested with robust error handling." },
  { title: "Dedicated Support", desc: "Ongoing technical assistance and support after launch." },
];

export const education = [
  {
    degree: "Bachelor of Computer Application (BCA)",
    school: "Sage University Indore — powered by Sunstone",
    years: "2024 – 2027",
    note: "Studying computer science fundamentals, web technologies, and data structures.",
  },
  {
    degree: "Class XII — Commerce",
    school: "Keshav International School",
    years: "2023 – 2024",
    note: "Completed high school while working on initial freelance web projects.",
  },
  {
    degree: "Class X",
    school: "Keshav International School",
    years: "2020 – 2021",
    note: "Discovered web development and built first HTML and CSS projects.",
  },
  {
    degree: "Computer Institute — Diploma track",
    school: "Rebenok Infotech",
    years: "Foundation",
    note: "Learned computer fundamentals, design basics, and typing skills.",
  },
];
