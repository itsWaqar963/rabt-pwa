export type LearnLesson = {
  id: string;
  title: string;
  youtubeId: string;
  contributor: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
};

export const DAILY_QUIZ_GOAL = 10;

/** Seed lessons — 2 pre-completed on first visit via store defaults */
export const SEED_LESSONS: LearnLesson[] = [
  {
    id: "intent-over-noise",
    title: "Intent over noise",
    youtubeId: "Eefw88whnv8",
    contributor: "Sana Khalid",
    question: "What makes a meetup worth showing up for?",
    options: [
      "A vague group chat",
      "Shared intent and a clear reason",
      "Random location drops",
      "Endless scrolling",
    ],
    correctIndex: 1,
  },
  {
    id: "show-up-rate",
    title: "Show-up rate",
    youtubeId: "aqz-KE-bpKQ",
    contributor: "Hamza Rauf",
    question: "What builds trust fastest offline?",
    options: [
      "Posting more stories",
      "Keeping your word in person",
      "Adding more filters",
      "Ghosting after RSVP",
    ],
    correctIndex: 1,
  },
  {
    id: "small-circles",
    title: "Small circles",
    youtubeId: "jNQXAC9IVRw",
    contributor: "Maryam Saeed",
    question: "Why keep gatherings small?",
    options: [
      "Less meaningful talk",
      "Easier real conversation",
      "More chaos",
      "Higher no-show risk",
    ],
    correctIndex: 1,
  },
  {
    id: "venue-clarity",
    title: "Venue clarity",
    youtubeId: "9bZkp7q19f0",
    contributor: "Bilal Khan",
    question: "When should exact venue unlock?",
    options: [
      "Before host accepts",
      "After host accepts the request",
      "Never share venue",
      "Only in DMs weeks later",
    ],
    correctIndex: 1,
  },
  {
    id: "reflection-loop",
    title: "Reflection loop",
    youtubeId: "kJQP7kiw5Fk",
    contributor: "Ayesha Noor",
    question: "What closes the loop after a meetup?",
    options: [
      "Ignoring the group",
      "A honest review and XP claim",
      "Deleting the event",
      "Posting unrelated memes",
    ],
    correctIndex: 1,
  },
  {
    id: "builder-walks",
    title: "Builder walks",
    youtubeId: "L_jWHffIx5E",
    contributor: "Omar Farooq",
    question: "Best format for low-pressure builder chat?",
    options: [
      "Formal keynote",
      "Walk and talk",
      "Silent webinar",
      "100-person stage",
    ],
    correctIndex: 1,
  },
  {
    id: "study-circles",
    title: "Study circles",
    youtubeId: "fJ9rUzIMcZQ",
    contributor: "Fatima Rahman",
    question: "What keeps a study circle useful?",
    options: [
      "No agenda ever",
      "One shared focus per session",
      "Competitive shaming",
      "Random topic jumps",
    ],
    correctIndex: 1,
  },
  {
    id: "community-safety",
    title: "Community safety",
    youtubeId: "RgKAFK5djSk",
    contributor: "Zain Ali",
    question: "What should hosts screen in meetup text?",
    options: [
      "Nothing at all",
      "Inappropriate or off-topic content",
      "Only emojis",
      "Long essays only",
    ],
    correctIndex: 1,
  },
  {
    id: "growth-xp",
    title: "Growth XP",
    youtubeId: "OPf0YbXqDm0",
    contributor: "Layla Hassan",
    question: "How do daily quizzes help on Reflect?",
    options: [
      "They replace meetups",
      "They reinforce learning and earn XP",
      "They hide your profile",
      "They block discovery",
    ],
    correctIndex: 1,
  },
  {
    id: "contribute-back",
    title: "Contribute back",
    youtubeId: "hT_nvWreIhg",
    contributor: "Sara Al-Harbi",
    question: "Why contribute a lesson?",
    options: [
      "To spam the feed",
      "To help others learn from your signal",
      "To skip reviews",
      "To unlock paid features",
    ],
    correctIndex: 1,
  },
];

export const DEFAULT_COMPLETED_IDS = ["intent-over-noise", "show-up-rate"];
