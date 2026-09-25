// Case study entries shown on the workshop bookshelf and in the menu.
// Entries marked `draft: true` are kept out of the game until they're
// filled in. No invented metrics: add real numbers when you have them.
export default class CaseStudies {
  static entries = [
    {
      id: "site-consolidation",
      title: "Two Sites, One Store",
      source: "ZippyPaws · Web Manager",
      summary:
        "Rebuilt separate wholesale (B2B) and direct-to-consumer sites as one ecommerce platform.",
      details: [
        "The problem: two separate websites, one for wholesale buyers and one for retail customers, meant double the maintenance and two stacks of aging code.",
        "Rebuilt from the ground up as a single site serving both audiences, on current frameworks.",
        "Migrated customer accounts from both sites while keeping every account's order history and original order IDs intact.",
        "The result: one site to maintain, less overhead, and a clean slate on tech debt. For a while, anyway.",
      ],
    },
    {
      id: "rewards-rebuild",
      title: "Starting Over on Rewards",
      source: "ZippyPaws · Web Manager",
      summary:
        "Replaced a rewards system that couldn't support the new program rules with a purpose-built plugin.",
      details: [
        "The problem: a redesigned rewards program came with rules the existing system was never built for.",
        "Rather than refactor the old system to conform, planned and built a new plugin around the new rules.",
        "Migrated every customer's existing points balance to the new system.",
        "More work up front, in exchange for a rewards program that fits how it actually works, not a patched version of the old one.",
      ],
    },
    {
      id: "mimi-website",
      title: "The Family Store's First Website",
      source: "Truong An, Denver · 2006 · First real-world project",
      summary:
        "Built the first ecommerce site for a family-owned gift store in Denver's Little Saigon, as a first freelance job out of college.",
      details: [
        "The problem: a family gift store with no web presence at all -- no domain, no hosting, no way to sell online.",
        "Registered the domain, set up hosting, and configured DNS and SSL.",
        "Set up payment processing so the store could take orders online.",
        "Going in, none of it was familiar. Learned each piece along the way and shipped a working store.",
        "A friend took a chance on a nervous new graduate. It worked, and it started everything that came after.",
      ],
    },
  ];
}
