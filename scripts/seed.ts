/**
 * Seeds demo data: 1 admin, 1 manager, 2 demo clients with 1 client user each, 10 posts across all
 * statuses, 60 days of ad insights, comments, notifications and last month's reports.
 *
 * Idempotent: users and clients are upserted by email/slug, and only records that belong to the demo
 * clients are replaced. Run with `pnpm seed` (local) or `pnpm seed --target=production`.
 */
import { requireVar, scriptMongoUri } from "./_env";
import bcrypt from "bcryptjs";
import mongoose, { type Types } from "mongoose";
import { connectDB } from "@/lib/db";
import type { PostStatus } from "@/lib/constants";
import {
  ActivityLog,
  AdInsightDaily,
  Client,
  Comment,
  Lead,
  Notification,
  Post,
  Report,
  User,
  type IAdInsightDaily,
} from "@/models";
import { summarizeInsights } from "@/lib/metrics";

const DAY = 24 * 60 * 60 * 1000;

/** Deterministic PRNG so the demo charts look the same on every seed. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function utcMidnight(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const round = (n: number, dp = 2) => Math.round(n * 10 ** dp) / 10 ** dp;

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "client";
  clientId?: Types.ObjectId;
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  return User.findOneAndUpdate(
    { email: input.email.toLowerCase() },
    {
      $set: {
        name: input.name,
        role: input.role,
        clientId: input.clientId ?? null,
        status: "active",
        passwordHash,
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
  ).orFail();
}

const DEMO_CLIENTS = [
  {
    slug: "demo-bakery",
    name: "Demo Bakery Co.",
    industry: "Food & Beverage",
    brandColors: { primary: "#d97706", secondary: "#fef3c7" },
    metaAdAccountIds: ["100000000000001"],
    userEmail: "client.bakery@example.com",
    userName: "Demo Bakery Owner",
    campaigns: ["Weekend Brunch Promo", "Custom Cakes Leads", "Retargeting: Site Visitors"],
    seed: 11,
  },
  {
    slug: "demo-fitness",
    name: "Demo Fitness Studio",
    industry: "Health & Fitness",
    brandColors: { primary: "#0ea5e9", secondary: "#e0f2fe" },
    metaAdAccountIds: ["100000000000002"],
    userEmail: "client.fitness@example.com",
    userName: "Demo Fitness Owner",
    campaigns: ["Free Trial Class", "New Year Membership", "Lookalike: Members"],
    seed: 29,
  },
] as const;

const POST_TEMPLATES: { title: string; caption: string; status: PostStatus; dayOffset: number }[] =
  [
    {
      title: "Behind the scenes",
      caption: "A peek at how we start every morning.",
      status: "published",
      dayOffset: -12,
    },
    {
      title: "Customer spotlight",
      caption: "Meet one of our regulars and hear their story.",
      status: "published",
      dayOffset: -6,
    },
    {
      title: "Weekly offer",
      caption: "This week only: something special for our community.",
      status: "approved",
      dayOffset: 2,
    },
    {
      title: "FAQ carousel",
      caption: "Answers to the questions we get asked most.",
      status: "pending_approval",
      dayOffset: 4,
    },
    {
      title: "Team introduction",
      caption: "Say hello to the people behind the brand.",
      status: "changes_requested",
      dayOffset: 7,
    },
    {
      title: "Monthly recap reel",
      caption: "Draft caption, to be finalised.",
      status: "draft",
      dayOffset: 12,
    },
  ];

async function main() {
  const uri = scriptMongoUri();
  await connectDB(uri);
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).syncIndexes()));

  const adminEmail = requireVar("SEED_ADMIN_EMAIL");
  const adminPassword = requireVar("SEED_ADMIN_PASSWORD");
  const demoPassword = requireVar("SEED_DEMO_PASSWORD");

  const admin = await upsertUser({
    name: "Agency Admin",
    email: adminEmail,
    password: adminPassword,
    role: "admin",
  });
  const manager = await upsertUser({
    name: "Account Manager",
    email: "manager@example.com",
    password: demoPassword,
    role: "manager",
  });

  const today = utcMidnight(new Date());
  let postCount = 0;

  for (const [clientIndex, demo] of DEMO_CLIENTS.entries()) {
    const client = await Client.findOneAndUpdate(
      { slug: demo.slug },
      {
        $set: {
          name: demo.name,
          industry: demo.industry,
          contactEmail: demo.userEmail,
          brandColors: demo.brandColors,
          metaAdAccountIds: demo.metaAdAccountIds,
          assignedManagers: [manager._id],
          plan: "growth",
          status: "active",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    ).orFail();

    const clientUser = await upsertUser({
      name: demo.userName,
      email: demo.userEmail,
      password: demoPassword,
      role: "client",
      clientId: client._id,
    });

    // Replace only this demo client's content.
    const oldPosts = await Post.find({ clientId: client._id }, { _id: 1 }).lean();
    await Promise.all([
      Comment.deleteMany({ postId: { $in: oldPosts.map((p) => p._id) } }),
      Post.deleteMany({ clientId: client._id }),
      AdInsightDaily.deleteMany({ clientId: client._id }),
      Report.deleteMany({ clientId: client._id }),
      ActivityLog.deleteMany({ clientId: client._id }),
      Notification.deleteMany({ userId: clientUser._id }),
    ]);

    // 10 posts in total: 5 per client, spread across every status.
    const templates = clientIndex === 0 ? POST_TEMPLATES.slice(0, 5) : POST_TEMPLATES.slice(1, 6);
    for (const [i, t] of templates.entries()) {
      const scheduledAt = new Date(today.getTime() + t.dayOffset * DAY + (10 + i) * 60 * 60 * 1000);
      const approved = t.status === "approved" || t.status === "published";
      const post = await Post.create({
        clientId: client._id,
        title: `${t.title}: ${demo.name}`,
        caption: t.caption,
        platforms: i % 2 === 0 ? ["facebook", "instagram"] : ["instagram"],
        mediaUrls: [`https://picsum.photos/seed/${demo.slug}-${i}/1080/1080`],
        scheduledAt,
        status: t.status,
        createdBy: manager._id,
        approvedBy: approved ? clientUser._id : null,
        approvedAt: approved ? new Date(scheduledAt.getTime() - 2 * DAY) : null,
        revisionCount: t.status === "changes_requested" ? 1 : 0,
      });
      postCount++;

      if (t.status === "changes_requested") {
        await Comment.create({
          postId: post._id,
          authorId: clientUser._id,
          body: "Could we use a brighter photo and mention the opening hours?",
        });
      }
      if (t.status === "pending_approval") {
        await Notification.create({
          userId: clientUser._id,
          type: "post_pending_approval",
          title: `"${post.title}" is ready for your approval`,
          link: `/portal/posts/${post._id.toString()}`,
        });
      }
      const events: { action: string; actor: Types.ObjectId }[] = [
        { action: "post.created", actor: manager._id },
      ];
      if (t.status !== "draft")
        events.push({ action: "post.sent_for_approval", actor: manager._id });
      if (approved) events.push({ action: "post.approved", actor: clientUser._id });
      if (t.status === "changes_requested") {
        events.push({ action: "post.changes_requested", actor: clientUser._id });
      }
      if (t.status === "published") events.push({ action: "post.published", actor: manager._id });
      await ActivityLog.insertMany(
        events.map((e, n) => ({
          actorId: e.actor,
          clientId: client._id,
          action: e.action,
          entity: "post",
          entityId: post._id,
          meta: { title: post.title },
          // Workflow events always sit in the past, in order, even for future posts.
          createdAt: new Date(
            Math.min(
              scheduledAt.getTime() - (8 - n * 2) * DAY,
              Date.now() - (events.length - n) * 5 * 60 * 60 * 1000,
            ),
          ),
        })),
      );
    }

    // 60 days of campaign-level insights ending yesterday.
    const rand = mulberry32(demo.seed);
    const insights: Omit<IAdInsightDaily, "_id" | "createdAt" | "updatedAt">[] = [];
    for (let d = 60; d >= 1; d--) {
      const date = new Date(today.getTime() - d * DAY);
      const trend = 1 + (60 - d) / 120; // gentle growth over the period
      const weekend = [0, 6].includes(date.getUTCDay()) ? 1.15 : 1;
      demo.campaigns.forEach((campaignName, c) => {
        const spend = round((18 + rand() * 22) * (1 + c * 0.35) * trend * weekend);
        const cpm = 6 + rand() * 6;
        const impressions = Math.round((spend / cpm) * 1000);
        const reach = Math.round(impressions * (0.62 + rand() * 0.2));
        const ctrPct = 0.9 + rand() * 1.6 + c * 0.2;
        const clicks = Math.max(1, Math.round((impressions * ctrPct) / 100));
        const conversions = Math.round(clicks * (0.03 + rand() * 0.05));
        const revenue = conversions * (25 + rand() * 40);
        insights.push({
          clientId: client._id,
          adAccountId: demo.metaAdAccountIds[0],
          campaignId: `${demo.metaAdAccountIds[0]}${c + 1}`,
          campaignName,
          date,
          spend,
          impressions,
          reach,
          clicks,
          ctr: round((clicks / impressions) * 100),
          cpc: round(spend / clicks),
          cpm: round((spend / impressions) * 1000),
          conversions,
          roas: round(revenue / spend),
        });
      });
    }
    await AdInsightDaily.insertMany(insights);

    // Report for last full month (PDF is rendered on demand when S3 is not configured).
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
    const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const monthRows = insights.filter((r) => r.date >= monthStart && r.date < monthEnd);
    const postsPublished = await Post.countDocuments({
      clientId: client._id,
      status: "published",
      scheduledAt: { $gte: monthStart, $lt: monthEnd },
    });
    await Report.create({
      clientId: client._id,
      month: monthStart.toISOString().slice(0, 7),
      pdfUrl: null,
      summary: { ...summarizeInsights(monthRows), postsPublished },
      generatedAt: new Date(),
    });
  }

  await Lead.updateOne(
    { email: "prospect@example.com" },
    {
      $setOnInsert: {
        name: "Sample Prospect",
        email: "prospect@example.com",
        company: "Sample Co.",
        service: "meta-ads",
        budget: "1k-3k",
        message: "Sample lead created by the seed script.",
        source: "seed",
        status: "new",
      },
    },
    { upsert: true },
  );

  console.log("Seed complete:");
  console.log(`  admin:   ${admin.email} (password from SEED_ADMIN_PASSWORD)`);
  console.log(`  manager: ${manager.email} (password from SEED_DEMO_PASSWORD)`);
  for (const demo of DEMO_CLIENTS)
    console.log(`  client:  ${demo.userEmail} (password from SEED_DEMO_PASSWORD)`);
  console.log(
    `  ${DEMO_CLIENTS.length} clients, ${postCount} posts, ${60 * 3 * DEMO_CLIENTS.length} insight rows`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
