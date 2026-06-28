import { generateSlug } from "@/lib/utils";
import type { Post } from "@/types";

export const posts: Post[] = [
  {
    id: "thailand-2025",
    slug: generateSlug("หนึ่งอาทิตย์ใน Thailand"),
    title: "หนึ่งอาทิตย์ใน Thailand",
    description: "Glimpse of the land of smiles",
    date: "2025-12-29",
    content: (
      <>
        <p>
          A week in Thailand filled with temples, street food, and unforgettable
          moments.
        </p>
        <p>
          This post shares my experiences exploring the vibrant culture and
          natural beauty of the country.
        </p>
      </>
    ),
  },
  {
    id: "dubai-2025",
    slug: generateSlug("أسبوع في Dubai"),
    title: "أسبوع في Dubai",
    description: "At the world's largest tech and AI event",
    date: "2025-10-30",
    content:
      "Attending GITEX 2025 in Dubai, surrounded by innovators and tech leaders. A week of networking, learning, and exploring the future of technology and AI.",
  },
  {
    id: "marriage-2025",
    slug: generateSlug("Married Life"),
    title: "Married Life",
    description: "Random thoughts about future",
    date: "2025-10-25",
    content:
      "Reflections on starting a new chapter in life. Thoughts on family, dreams, and what the future holds.",
  },
  {
    id: "indonesia-2024",
    slug: generateSlug("Seminggu di Indonesia"),
    title: "Seminggu di Indonesia",
    description: "Adventure is everything",
    date: "2024-08-30",
    content:
      "A week exploring Indonesia's islands, beaches, and the warmth of its people. Adventure is the best teacher, and Indonesia has plenty to teach.",
  },
  {
    id: "aetherlenz-2024",
    slug: generateSlug("Building AetherLenz"),
    title: "Building AetherLenz",
    description: "Believing that fortune favors the brave",
    date: "2024-02-25",
    content:
      "My journey with AetherLenz and lessons learned from taking bold decisions. Fortune favors the brave, and sometimes you need to leap before you're ready.",
  },
  {
    id: "rookie-2023",
    slug: generateSlug("Rookie"),
    title: "Rookie",
    description: "Lessons I learned from my manager (ex-Google)",
    date: "2023-12-20",
    content:
      "As a rookie in the industry, I learned invaluable lessons from my manager who had experience at Google. This post shares key takeaways about engineering, mindset, and growth.",
  },
];
