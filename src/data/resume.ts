// ---------------------------------------------------------------------------
// Resume content — the single source of truth for everything on the site.
//
// Edit this file to add, remove, or reword anything. The page HTML, the
// career timeline, and the skills chart are all generated from it, so
// nothing else needs to change. Run `npm run dev` to preview edits live.
//
// Dates use "YYYY-MM". Use `end: null` for a current role ("Present").
// ---------------------------------------------------------------------------

export interface Role {
  id: string;
  title: string;
  org: string;
  // Short name for the timeline chart labels.
  short: string;
  start: string;
  end: string | null;
  kind: 'research' | 'industry' | 'teaching' | 'leadership';
  bullets: string[];
}

export interface School {
  school: string;
  degree: string;
  detail?: string;
  date: string;
}

export type SkillGroup = 'code' | 'data' | 'engineering' | 'design' | 'research';

export interface Skill {
  name: string;
  group: SkillGroup;
  // Role ids (from ROLES/LEADERSHIP below) or 'site' for this website.
  // Leave empty for skills listed on the resume without a specific role.
  usedIn: string[];
  // Text to look for in that role's bullets, to quote as evidence. Defaults to `name`.
  match?: string;
}

export const PROFILE = {
  name: 'Anika Manjesh',
  tagline:
    "I'm a Data Science student at U.C. Berkeley graduating in May 2028 with experience across software, AI, and space.",
  about: [
    "I'm a junior at U.C. Berkeley focused on learning and exploring. I am currently interested in broadening my experiences in data, AI, and software. I enjoy the domain of space and am currently involved in multiple projects exploring AI tools and natural phenomena.",
    'I love talking to new people so feel free to reach out!',
  ],
  email: 'anikamanjesh@gmail.com',
  github: 'https://github.com/coderbeansmidnight',
  linkedin: 'https://www.linkedin.com/in/anika-manjesh/',
};

export const ROLES: Role[] = [
  {
    id: 'space-force',
    title: 'AI Student Researcher',
    // Collaboration through NewSpace @ Berkeley; not employed by the Space Force directly.
    org: 'NewSpace @ Berkeley, in collaboration with the U.S. Space Force',
    short: 'NewSpace @ Berkeley',
    start: '2026-09',
    end: null,
    kind: 'research',
    bullets: [
      'Investigating how much autonomy AI agents can exercise in scientific inquiry as part of a team building a shared agent harness',
      'Running experiments on ReplicationBench (expert-validated astrophysics research tasks) to compare levels of human oversight and test whether agents revise claims and next steps in response to evidence',
      'Working toward a research paper and reproducible codebase by end of semester',
    ],
  },
  {
    id: 'carruthers',
    title: 'NASA Carruthers Mission URAP | Research Intern',
    org: 'UC Berkeley Space Sciences Laboratory',
    short: 'NASA Carruthers',
    start: '2026-09',
    end: null,
    kind: 'research',
    bullets: [
      'Working under NASA Carruthers Mission Project Scientist to process and analyze images from satellite',
    ],
  },
  {
    id: 'lockheed',
    title: 'Systems Engineering Intern and Co-op',
    org: 'Lockheed Martin',
    short: 'Lockheed Martin',
    start: '2025-05',
    end: '2026-08',
    kind: 'industry',
    bullets: [
      'Developed scripts to reduce metrics processing time by 90%, saving hours of work for Systems Engineers',
      'Built Python automation tools to reduce manual processing time and improve workflow efficiency',
      'Developed visualizations to model requirements data using Python and Pandas',
      'Assisted Systems Engineer spec authors in crafting multi-functional requirements in DOORS Next Gen',
    ],
  },
  {
    id: 'sri',
    title: 'AI Software Project Intern',
    // Collaboration through a San José State University course.
    org: 'San José State University course, in collaboration with Stanford Research Institute (SRI)',
    short: 'SRI × SJSU course',
    start: '2026-02',
    end: '2026-06',
    kind: 'industry',
    bullets: [
      'Collaborated internationally with a team of 10 from SJSU, SRI, and Technische Hochschule Ingolstadt',
      'Developed a grammar formalizer enabling domain experts to work with AI models via OpenAI tokens',
      'Designed a Human-in-the-Loop validator to ensure grammar change outputs matched desired outcomes',
      'Containerized and version-controlled project components using Docker and GitLab',
    ],
  },
  {
    id: 'isa',
    title: 'Instructional Student Assistant',
    org: 'San José State University, Physics Department',
    short: 'SJSU Physics',
    start: '2025-08',
    end: '2026-05',
    kind: 'teaching',
    bullets: [
      'Grade student assignments for Physics 50 - Mechanics, selected for the role due to strong academic performance',
      'Assisted professor with exam administration, grading, and digitizing course for 21st century',
    ],
  },
];

export const LEADERSHIP: Role[] = [
  {
    id: 'swe',
    title: 'Society of Women Engineers',
    org: 'Professional Development Committee Chair at SJSU + Professional Development Month Chair at UC Berkeley',
    short: 'Society of Women Engineers',
    start: '2024-08',
    end: null,
    kind: 'leadership',
    bullets: [
      'Created "LeetCode Lock-In," a technical interview prep event with 30+ attendees; selected by SWE National Organization for the Collegiate Leadership Institute (CLI)',
    ],
  },
  {
    id: 'ra',
    title: 'Resident Advisor',
    org: 'San José State University',
    short: 'Resident Advisor',
    start: '2025-07',
    end: '2026-05',
    kind: 'leadership',
    bullets: [
      'Coordinated community programs for 60+ residents, fostering engagement and inclusion within the residence hall',
      'Served multiple 24 hr duty shifts handling nighttime calls involving emergencies, resident assistance, or lockouts',
    ],
  },
];

export const EDUCATION: School[] = [
  {
    school: 'University of California, Berkeley',
    degree: 'B.A., Data Science',
    date: 'Expected May 2028',
  },
  {
    school: 'San José State University',
    degree: 'B.S., Computer Science',
    detail: "President's Scholar. GPA: 3.93",
    date: 'Transferred June 2026',
  },
];

export const COURSEWORK = ['Data Structures and Algorithms', 'Intro to AI', 'Intro to Data Visualization'];

export const AWARDS = [
  '1 of 40 to receive “Rising Spartan Award” for care and commitment to Resident Advisor role',
];

export const SPOKEN_LANGUAGES = 'French and English Biliteracy';

export const SKILL_GROUPS: Record<SkillGroup, string> = {
  code: 'Programming',
  data: 'Data & AI',
  engineering: 'Engineering tools',
  design: 'Design & collaboration',
  research: 'Research areas',
};

// Every skill below is either on the resume's skills line or named in a
// resume bullet. `usedIn` links each one to the roles whose bullets mention it.
export const SKILLS: Skill[] = [
  { name: 'Python', group: 'code', usedIn: ['lockheed'] },
  { name: 'Java', group: 'code', usedIn: [] },
  { name: 'JavaScript', group: 'code', usedIn: ['site'] },
  { name: 'MySQL', group: 'code', usedIn: [] },
  { name: 'HTML', group: 'code', usedIn: ['site'] },
  { name: 'CSS', group: 'code', usedIn: ['site'] },

  { name: 'Pandas', group: 'data', usedIn: ['lockheed'] },
  { name: 'Tableau', group: 'data', usedIn: [] },
  { name: 'Data visualization', group: 'data', usedIn: ['lockheed'], match: 'visualizations' },
  { name: 'OpenAI API', group: 'data', usedIn: ['sri'], match: 'OpenAI' },

  { name: 'Git', group: 'engineering', usedIn: ['sri'], match: 'version-controlled' },
  { name: 'GitLab', group: 'engineering', usedIn: ['sri'] },
  { name: 'Docker', group: 'engineering', usedIn: ['sri'] },
  { name: 'REST APIs', group: 'engineering', usedIn: [] },
  { name: 'DOORS Next Gen', group: 'engineering', usedIn: ['lockheed'] },

  { name: 'Figma', group: 'design', usedIn: [] },
  { name: 'Confluence', group: 'design', usedIn: [] },

  { name: 'AI agents', group: 'research', usedIn: ['space-force'] },
  { name: 'Human-in-the-loop', group: 'research', usedIn: ['sri', 'space-force'], match: 'human' },
  { name: 'Satellite image analysis', group: 'research', usedIn: ['carruthers'], match: 'images from satellite' },
];
