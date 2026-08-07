export type ResumeItem = {
  title: string;
  subtitle?: string;
  meta?: string;
  link?: string;
  bullets: string[];
};

export type ResumeGroup = { label: string; value: string; link?: string };

export type ResumeSection = {
  id: string;
  heading: string;
  kind: "items" | "groups";
  items?: ResumeItem[];
  groups?: ResumeGroup[];
};

export type ResumeData = {
  name: string;
  role: string;
  email: string;
  location: string;
  links: string[];
  summary: string;
  sections: ResumeSection[];
};

export const resumeDefault: ResumeData = {
  name: "Chetan Prajapat",
  role: "Full Stack Developer & Video Editor",
  email: "contact.chetanprajapat@gmail.com",
  location: "",
  links: ["github.com/grchetan", "linkedin.com/in/chetan-prajapat", "chetanprajapat.in"],
  summary:
    "BCA student and passionate full stack web developer with 2+ years of experience building responsive, high-performance web applications using HTML, React.js, Node.js, Express, MongoDB and SQL. Creative video editor skilled in digital content production and SEO. Currently seeking opportunities to contribute to world-class teams and products.",
  sections: [
    {
      id: "experience",
      heading: "Work Experience",
      kind: "items",
      items: [
        {
          title: "Full Stack Web Developer Intern",
          subtitle: "Rebenok Infotech",
          meta: "Apr 2023 – Aug 2023",
          bullets: [
            "Worked as a part-time video editor for social media content.",
            "Updated website content to keep pages accurate and current.",
          ],
        },
      ],
    },
    {
      id: "projects",
      heading: "Projects",
      kind: "items",
      items: [
        {
          title: "Crafting Fit Bridge",
          subtitle: "GitHub Repository",
          meta: "2025",
          link: "https://github.com/grchetan",
          bullets: [
            "A fitness platform for workout, diet planning and body transformation with a user-friendly UI and robust backend.",
            "Built with React.js, Node.js, Express and MongoDB.",
          ],
        },
        {
          title: "Travel Itinerary Generator",
          subtitle: "chetanprajapat.in/Travel-Itinerary-Generator",
          meta: "2025",
          link: "https://www.chetanprajapat.in/Travel-Itinerary-Generator",
          bullets: [
            "AI-powered web app generating custom travel itineraries based on user preferences using n8n AI automation.",
            "Built with HTML, CSS, JavaScript and an integrated AI API.",
          ],
        },
        {
          title: "ASUS ROG Website Clone",
          subtitle: "chetanprajapat.in/Rog-Asus",
          meta: "2024",
          link: "https://www.chetanprajapat.in/Rog-Asus",
          bullets: [
            "Pixel-perfect clone of the ASUS ROG website with modern UI and gaming aesthetics.",
            "Focused on performance, animations and responsive design.",
          ],
        },
        {
          title: "Weather Forecast App",
          meta: "2024",
          bullets: [
            "Real-time weather app with live API integration for any global location.",
            "Clean UI with search functionality and live forecast data display.",
          ],
        },
      ],
    },
    {
      id: "skills",
      heading: "Skills",
      kind: "groups",
      groups: [
        { label: "Frontend", value: "React.js · HTML5 · CSS3 · JavaScript" },
        { label: "Backend", value: "Node.js · Express.js · REST APIs" },
        { label: "Database", value: "MongoDB · SQL · Database Design" },
        { label: "Tools", value: "Git · GitHub · Linux · Cursor AI · VS Code" },
        { label: "Marketing", value: "SEO Optimization · Canva" },
        { label: "Other", value: "Video Editing · Python · Java" },
      ],
    },
    {
      id: "certifications",
      heading: "Certifications",
      kind: "groups",
      groups: [
        { label: "Web Development", value: "Udemy — Jan 2025" },
        { label: "Cursor AI", value: "Sunstone — Feb 2026" },
        { label: "Git & GitHub", value: "Sunstone — Feb 2025" },
        { label: "Ethical Hacking", value: "Udemy — Jan 2025" },
        { label: "C Programming", value: "Sunstone — Apr 2025" },
        { label: "Canva Editing", value: "Canva — Jul 2024" },
        { label: "Typing Speed", value: "Typing Club — Oct 2022" },
      ],
    },
    {
      id: "education",
      heading: "Education",
      kind: "items",
      items: [
        {
          title: "Bachelor of Computer Application (BCA)",
          subtitle: "Sage University Indore, powered by Sunstone",
          meta: "2024 – 2027",
          link: "https://sageuniversity.edu.in",
          bullets: [],
        },
        {
          title: "Class XII (Commerce)",
          subtitle: "Keshav International School",
          meta: "2023 – 2024",
          bullets: [],
        },
        {
          title: "Class X",
          subtitle: "Keshav International School",
          meta: "2020 – 2021",
          bullets: [],
        },
        {
          title: "Computer Institute",
          subtitle: "Rebenok Infotech",
          meta: "",
          bullets: [],
        },
      ],
    },
  ],
};
