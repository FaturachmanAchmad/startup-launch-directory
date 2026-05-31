import { PrismaClient, ProductStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import slugify from "slugify";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "ai-ml" },
      update: {},
      create: {
        name: "AI & ML",
        slug: "ai-ml",
        description: "Artificial intelligence and machine learning products",
        icon: "🤖",
        color: "#6366f1",
      },
    }),
    prisma.category.upsert({
      where: { slug: "developer-tools" },
      update: {},
      create: {
        name: "Developer Tools",
        slug: "developer-tools",
        description: "Tools and utilities for developers",
        icon: "🛠️",
        color: "#f59e0b",
      },
    }),
    prisma.category.upsert({
      where: { slug: "productivity" },
      update: {},
      create: {
        name: "Productivity",
        slug: "productivity",
        description: "Apps to boost your productivity",
        icon: "⚡",
        color: "#10b981",
      },
    }),
    prisma.category.upsert({
      where: { slug: "saas" },
      update: {},
      create: {
        name: "SaaS",
        slug: "saas",
        description: "Software as a service products",
        icon: "☁️",
        color: "#3b82f6",
      },
    }),
    prisma.category.upsert({
      where: { slug: "fintech" },
      update: {},
      create: {
        name: "Fintech",
        slug: "fintech",
        description: "Financial technology solutions",
        icon: "💰",
        color: "#84cc16",
      },
    }),
    prisma.category.upsert({
      where: { slug: "design" },
      update: {},
      create: {
        name: "Design",
        slug: "design",
        description: "Design tools and resources",
        icon: "🎨",
        color: "#ec4899",
      },
    }),
    prisma.category.upsert({
      where: { slug: "marketing" },
      update: {},
      create: {
        name: "Marketing",
        slug: "marketing",
        description: "Marketing and growth tools",
        icon: "📈",
        color: "#f97316",
      },
    }),
    prisma.category.upsert({
      where: { slug: "no-code" },
      update: {},
      create: {
        name: "No-Code",
        slug: "no-code",
        description: "Build without code",
        icon: "🧩",
        color: "#a855f7",
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@launchdirectory.io" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@launchdirectory.io",
      password: adminPassword,
      role: Role.ADMIN,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
    },
  });

  // Create demo users
  const userPassword = await bcrypt.hash("password123", 12);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: "john@example.com" },
      update: {},
      create: {
        name: "John Maker",
        email: "john@example.com",
        password: userPassword,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
      },
    }),
    prisma.user.upsert({
      where: { email: "sarah@example.com" },
      update: {},
      create: {
        name: "Sarah Builder",
        email: "sarah@example.com",
        password: userPassword,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      },
    }),
    prisma.user.upsert({
      where: { email: "alex@example.com" },
      update: {},
      create: {
        name: "Alex Founder",
        email: "alex@example.com",
        password: userPassword,
        image: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length + 1} users`);

  // Sample products
  const sampleProducts = [
    {
      name: "NeuralDraft",
      tagline: "AI-powered writing assistant for busy founders",
      description:
        "NeuralDraft is an AI writing tool that helps startup founders craft compelling narratives, pitch decks, and investor updates in minutes. Powered by GPT-4, it understands startup context and produces content that resonates with investors and customers alike.\n\nKey features:\n- One-click pitch deck generator\n- Investor update templates\n- Cold email campaigns\n- Blog post automation\n- Brand voice consistency",
      websiteUrl: "https://neuraldraft.example.com",
      twitterUrl: "https://twitter.com/neuraldraft",
      categorySlug: "ai-ml",
      featured: true,
      userId: users[0].id,
    },
    {
      name: "DevFlow",
      tagline: "Git workflow automation for small teams",
      description:
        "DevFlow streamlines your development workflow with automated PR reviews, smart branch management, and one-click deployments. Built for indie hackers and small teams who want GitHub superpowers without the enterprise price tag.\n\nFeatures:\n- Automated code reviews\n- Smart merge queues\n- One-click staging deployments\n- Slack/Discord notifications\n- CI/CD pipeline builder",
      websiteUrl: "https://devflow.example.com",
      twitterUrl: "https://twitter.com/devflowapp",
      categorySlug: "developer-tools",
      featured: true,
      userId: users[1].id,
    },
    {
      name: "FocusPad",
      tagline: "Distraction-free workspace for deep work",
      description:
        "FocusPad blocks distractions and helps you enter a flow state faster. With Pomodoro timers, ambient sounds, and smart focus sessions, it's the productivity tool designed for makers who build in public.\n\nHighlights:\n- Website blocker\n- Pomodoro timer\n- Focus analytics\n- Team accountability\n- Daily planning dashboard",
      websiteUrl: "https://focuspad.example.com",
      twitterUrl: "https://twitter.com/focuspadapp",
      categorySlug: "productivity",
      featured: false,
      userId: users[2].id,
    },
    {
      name: "LaunchMetrics",
      tagline: "Track your SaaS metrics from day one",
      description:
        "LaunchMetrics provides indie founders with enterprise-grade analytics at a fraction of the cost. Track MRR, churn, LTV, and 50+ other SaaS metrics with beautiful dashboards that you can share with investors.\n\nCore metrics:\n- MRR & ARR tracking\n- Churn analysis\n- Cohort retention\n- Revenue forecasting\n- Investor reports",
      websiteUrl: "https://launchmetrics.example.com",
      twitterUrl: "https://twitter.com/launchmetrics",
      categorySlug: "saas",
      featured: true,
      userId: users[0].id,
    },
    {
      name: "PixelCraft",
      tagline: "Design system builder for non-designers",
      description:
        "PixelCraft lets developers and founders create professional design systems without design expertise. Generate cohesive color palettes, typography scales, and component libraries from a single brand color.\n\nWhat you get:\n- Design token generator\n- Component library\n- Dark mode support\n- Figma integration\n- CSS/Tailwind export",
      websiteUrl: "https://pixelcraft.example.com",
      twitterUrl: "https://twitter.com/pixelcraftapp",
      categorySlug: "design",
      featured: false,
      userId: users[1].id,
    },
    {
      name: "FormBase",
      tagline: "Backend for your forms without any code",
      description:
        "FormBase handles all your form submissions, spam protection, and notifications so you can focus on building. Just point your HTML form to our endpoint and you're done.\n\nFeatures:\n- Email notifications\n- Spam protection\n- File uploads\n- Webhook support\n- CSV exports",
      websiteUrl: "https://formbase.example.com",
      twitterUrl: "https://twitter.com/formbaseio",
      categorySlug: "no-code",
      featured: false,
      userId: users[2].id,
    },
    {
      name: "GrowthLoop",
      tagline: "Automated referral programs for SaaS startups",
      description:
        "GrowthLoop makes it trivially easy to add a referral program to any SaaS product. With just a few lines of code, offer rewards, track referrals, and watch your user acquisition costs drop.\n\nCapabilities:\n- One-line embed\n- Custom reward logic\n- Fraud detection\n- Analytics dashboard\n- Email automation",
      websiteUrl: "https://growthloop.example.com",
      twitterUrl: "https://twitter.com/growthloopio",
      categorySlug: "marketing",
      featured: true,
      userId: users[0].id,
    },
    {
      name: "CoinBridge",
      tagline: "Accept crypto payments in 5 minutes",
      description:
        "CoinBridge lets any business accept Bitcoin, Ethereum, and 50+ cryptocurrencies with instant fiat conversion. No crypto knowledge required — just plug in our SDK and start accepting payments today.\n\nSupports:\n- 50+ cryptocurrencies\n- Instant fiat conversion\n- Subscription billing\n- Invoice generation\n- Tax reporting",
      websiteUrl: "https://coinbridge.example.com",
      twitterUrl: "https://twitter.com/coinbridgeio",
      categorySlug: "fintech",
      featured: false,
      userId: users[1].id,
    },
  ];

  for (const productData of sampleProducts) {
    const { categorySlug, ...rest } = productData;
    const category = categories.find((c) => c.slug === categorySlug);
    if (!category) continue;

    const slug = slugify(rest.name, { lower: true, strict: true });

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        ...rest,
        slug,
        categoryId: category.id,
        status: ProductStatus.APPROVED,
        launchDate: new Date(
          Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
        ),
      },
    });
  }

  console.log(`✅ Created ${sampleProducts.length} products`);
  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin: admin@launchdirectory.io / admin123");
  console.log("   User:  john@example.com / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
