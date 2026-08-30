const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Platform Settings ───────────────────────────
  const settings = [
    // Financial
    { key: 'platform_fee_percent',              value: '10',    type: 'number', label: 'Platform Fee (%)',                       group: 'financial' },
    { key: 'screenshot_fee_percent',            value: '3',     type: 'number', label: 'Screenshot/Proof Fee (%)',               group: 'financial' },
    { key: 'min_withdrawal_amount',             value: '1.00',  type: 'number', label: 'Minimum Withdrawal ($)',                 group: 'financial' },
    { key: 'withdrawal_fee_percent',            value: '6',     type: 'number', label: 'Worker Withdrawal Fee (%)',              group: 'financial' },
    { key: 'min_job_reward',                    value: '0.01',  type: 'number', label: 'Minimum Job Reward ($)',                 group: 'financial' },
    { key: 'min_job_budget',                    value: '0.80',  type: 'number', label: 'Minimum Job Budget ($)',                 group: 'financial' },
    // Boost pricing (fixed USD amounts)
    { key: 'boost_1m_price',                    value: '0.04',  type: 'number', label: 'Boost 1 Minute Price ($)',               group: 'boost' },
    { key: 'boost_5m_price',                    value: '0.07',  type: 'number', label: 'Boost 5 Minutes Price ($)',              group: 'boost' },
    { key: 'boost_10m_price',                   value: '0.15',  type: 'number', label: 'Boost 10 Minutes Price ($)',             group: 'boost' },
    { key: 'boost_15m_price',                   value: '0.20',  type: 'number', label: 'Boost 15 Minutes Price ($)',             group: 'boost' },
    // Referral
    { key: 'referral_task_commission_percent',  value: '5',     type: 'number', label: 'Referral Task Commission (%)',           group: 'referral' },
    { key: 'referral_deposit_commission_percent', value: '5',   type: 'number', label: 'Referral Deposit Commission (%)',        group: 'referral' },
    // Upload
    { key: 'max_proof_size_mb',                 value: '10',    type: 'number', label: 'Max Proof Upload Size (MB)',             group: 'upload' },
    // Tasks
    { key: 'task_expiry_hours',                 value: '48',    type: 'number', label: 'Default Task Expiry (hours)',            group: 'tasks' },
    { key: 'max_resubmissions',                 value: '3',     type: 'number', label: 'Max Resubmissions',                     group: 'tasks' },
    { key: 'default_estimated_days',            value: '3',     type: 'number', label: 'Default Estimated Completion Days',     group: 'tasks' },
    // General
    { key: 'site_name',                         value: 'TaskHive', type: 'string', label: 'Site Name',                          group: 'general' },
    { key: 'site_description',                  value: 'Earn money completing micro tasks online', type: 'string', label: 'Site Description', group: 'general' },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, label: setting.label },
      create: setting,
    });
  }
  console.log('✅ Platform settings seeded');

  // ─── Admin Payment Methods ─────────────────────
  const paymentMethods = [
    { name: 'bKash Personal',  type: 'BKASH', number: '01700000000', accountName: 'TaskHive BD', sortOrder: 1 },
    { name: 'Nagad Personal',  type: 'NAGAD', number: '01800000000', accountName: 'TaskHive BD', sortOrder: 2 },
  ];

  for (const pm of paymentMethods) {
    const existing = await prisma.paymentMethod.findFirst({ where: { type: pm.type, number: pm.number } });
    if (!existing) {
      await prisma.paymentMethod.create({ data: pm });
    }
  }
  console.log('✅ Payment methods seeded');

  // ─── Categories & Subcategories ───────────────
  // Full spec from requirements
  const categoryDefs = [
    {
      name: 'Ads Click', slug: 'ads-click', icon: 'MousePointer', description: 'Click on advertisement tasks',
      subcategories: [
        { name: 'YouTube Ads',     slug: 'youtube-ads',     defaultReward: 0.030, defaultCriteria: 'Watch and click on YouTube advertisement as instructed' },
        { name: 'Facebook Video Ads', slug: 'facebook-video-ads', defaultReward: 0.030, defaultCriteria: 'Watch and click on Facebook video advertisement' },
        { name: 'Website Ads',     slug: 'website-ads',     defaultReward: 0.032, defaultCriteria: 'Visit website and click on specified advertisement' },
      ],
    },
    {
      name: 'Comment', slug: 'comment', icon: 'MessageSquare', description: 'Leave comments on social media platforms',
      subcategories: [
        { name: 'YouTube Comment',   slug: 'youtube-comment',   defaultReward: 0.020, defaultCriteria: 'Leave a positive relevant comment on YouTube video' },
        { name: 'Facebook Comment',  slug: 'facebook-comment',  defaultReward: 0.020, defaultCriteria: 'Leave a positive relevant comment on Facebook post' },
        { name: 'Instagram Comment', slug: 'instagram-comment', defaultReward: 0.020, defaultCriteria: 'Leave a positive relevant comment on Instagram post' },
      ],
    },
    {
      name: 'Facebook', slug: 'facebook', icon: 'Facebook', description: 'Facebook engagement tasks',
      subcategories: [
        { name: 'Page Like',                slug: 'fb-page-like',       defaultReward: 0.020, defaultCriteria: 'Like the specified Facebook page' },
        { name: 'Follower',                 slug: 'fb-follower',        defaultReward: 0.020, defaultCriteria: 'Follow the specified Facebook profile/page' },
        { name: 'Like + Comment',           slug: 'fb-like-comment',    defaultReward: 0.030, defaultCriteria: 'Like and leave a positive comment on the post' },
        { name: 'Video Like',               slug: 'fb-video-like',      defaultReward: 0.020, defaultCriteria: 'Like the specified Facebook video' },
        { name: 'Like + Follow + Post React', slug: 'fb-like-follow-react', defaultReward: 0.060, defaultCriteria: 'Like page, follow, and react to latest post' },
      ],
    },
    {
      name: 'Instagram', slug: 'instagram', icon: 'Instagram', description: 'Instagram engagement tasks',
      subcategories: [
        { name: 'Page Like',          slug: 'ig-page-like',     defaultReward: 0.020, defaultCriteria: 'Like the specified Instagram page/post' },
        { name: 'Follower',           slug: 'ig-follower',      defaultReward: 0.020, defaultCriteria: 'Follow the specified Instagram account' },
        { name: 'Like + Comment',     slug: 'ig-like-comment',  defaultReward: 0.030, defaultCriteria: 'Like and leave a relevant comment on Instagram post' },
        { name: 'Video Like',         slug: 'ig-video-like',    defaultReward: 0.020, defaultCriteria: 'Like the specified Instagram video/reel' },
        { name: 'Follow + Post React', slug: 'ig-follow-react', defaultReward: 0.040, defaultCriteria: 'Follow account and react to their latest post' },
      ],
    },
    {
      name: 'Mobile App', slug: 'mobile-app', icon: 'Smartphone', description: 'Mobile application tasks',
      subcategories: [
        { name: 'Download Only',             slug: 'app-download',           defaultReward: 0.050, defaultCriteria: 'Download the app from Play Store or App Store' },
        { name: 'Complex Sign Up',           slug: 'app-complex-signup',     defaultReward: 0.150, defaultCriteria: 'Download app and complete full registration with profile' },
        { name: 'Download + Review',         slug: 'app-download-review',    defaultReward: 0.070, defaultCriteria: 'Download app and leave a 5-star review with comment' },
        { name: 'Sign Up + Face Verification', slug: 'app-signup-face',      defaultReward: 0.100, defaultCriteria: 'Complete sign up including face/ID verification' },
      ],
    },
    {
      name: 'Need Follower', slug: 'need-follower', icon: 'Users', description: 'Gain followers on social platforms',
      subcategories: [
        { name: 'Facebook Follower', slug: 'follower-facebook',  defaultReward: 0.020, defaultCriteria: 'Follow the specified Facebook profile' },
        { name: 'Instagram Follower', slug: 'follower-instagram', defaultReward: 0.020, defaultCriteria: 'Follow the specified Instagram account' },
        { name: 'TikTok Follower',   slug: 'follower-tiktok',   defaultReward: 0.020, defaultCriteria: 'Follow the specified TikTok account' },
      ],
    },
    {
      name: 'Search and Click', slug: 'search-and-click', icon: 'Search', description: 'Search engine click tasks',
      subcategories: [
        { name: 'Click 1x',  slug: 'search-click-1x', defaultReward: 0.020, defaultCriteria: 'Search keyword and click the specified result once' },
        { name: 'Click 2x',  slug: 'search-click-2x', defaultReward: 0.025, defaultCriteria: 'Search keyword and click the specified result twice' },
        { name: 'Click 3x',  slug: 'search-click-3x', defaultReward: 0.030, defaultCriteria: 'Search keyword and click the specified result three times' },
        { name: 'Click 5x',  slug: 'search-click-5x', defaultReward: 0.070, defaultCriteria: 'Search keyword and click the specified result five times' },
      ],
    },
    {
      name: 'Sign Up', slug: 'sign-up', icon: 'UserPlus', description: 'Registration tasks on platforms',
      subcategories: [
        { name: 'Email Submit Only',    slug: 'signup-email',        defaultReward: 0.050, defaultCriteria: 'Submit email address on the specified signup form' },
        { name: 'Simple Sign Up',       slug: 'signup-simple',       defaultReward: 0.070, defaultCriteria: 'Complete basic registration with name, email, password' },
        { name: 'Complex Sign Up',      slug: 'signup-complex',      defaultReward: 0.170, defaultCriteria: 'Complete full registration including profile information' },
        { name: 'Sign Up + Ads Click',  slug: 'signup-ads-click',    defaultReward: 0.400, defaultCriteria: 'Complete registration and click on specified advertisement' },
      ],
    },
    {
      name: 'Telegram', slug: 'telegram', icon: 'Send', description: 'Telegram channel and group tasks',
      subcategories: [
        { name: 'Member for Group',   slug: 'telegram-group',   defaultReward: 0.020, defaultCriteria: 'Join the specified Telegram group' },
        { name: 'Member for Channel', slug: 'telegram-channel', defaultReward: 0.020, defaultCriteria: 'Join the specified Telegram channel' },
        { name: 'Telegram Bot',       slug: 'telegram-bot',     defaultReward: 0.030, defaultCriteria: 'Start and interact with the specified Telegram bot' },
      ],
    },
    {
      name: 'Views', slug: 'views', icon: 'Eye', description: 'Video and content view tasks',
      subcategories: [
        { name: 'YouTube Video Views',   slug: 'views-youtube',   defaultReward: 0.020, defaultCriteria: 'Watch YouTube video for the specified duration' },
        { name: 'Facebook Video Views',  slug: 'views-facebook',  defaultReward: 0.020, defaultCriteria: 'Watch Facebook video for the specified duration' },
        { name: 'Instagram Video Views', slug: 'views-instagram', defaultReward: 0.020, defaultCriteria: 'Watch Instagram video/reel for the specified duration' },
      ],
    },
    {
      name: 'Visitor', slug: 'visitor', icon: 'Globe', description: 'Website visit tasks',
      subcategories: [
        { name: 'Website Visit',           slug: 'visit-basic',         defaultReward: 0.020, defaultCriteria: 'Visit the website and browse for the specified time' },
        { name: 'Website Visit + Share',   slug: 'visit-share',         defaultReward: 0.040, defaultCriteria: 'Visit website and share a page on social media' },
        { name: 'Website Visit + Ads Click', slug: 'visit-ads-click',   defaultReward: 0.025, defaultCriteria: 'Visit website and click on specified advertisement' },
      ],
    },
    {
      name: 'YouTube', slug: 'youtube', icon: 'Play', description: 'YouTube watch and engagement tasks',
      subcategories: [
        { name: 'Video 1-2min + Comment',              slug: 'yt-1-2m-comment',    defaultReward: 0.020, defaultCriteria: 'Watch 1-2 min video fully and leave positive comment' },
        { name: 'Video 1-2min + Subscribe + Comment',  slug: 'yt-1-2m-sub-comment', defaultReward: 0.022, defaultCriteria: 'Watch 1-2 min video, subscribe, and comment' },
        { name: 'Video 1-5min + Comment',              slug: 'yt-1-5m-comment',    defaultReward: 0.026, defaultCriteria: 'Watch 1-5 min video fully and leave positive comment' },
        { name: 'Video 1-5min + Subscribe + Comment',  slug: 'yt-1-5m-sub-comment', defaultReward: 0.030, defaultCriteria: 'Watch 1-5 min video, subscribe, and comment' },
        { name: 'Video 1-8min + Comment',              slug: 'yt-1-8m-comment',    defaultReward: 0.035, defaultCriteria: 'Watch 1-8 min video fully and leave positive comment' },
        { name: 'Video 1-8min + Subscribe + Comment',  slug: 'yt-1-8m-sub-comment', defaultReward: 0.040, defaultCriteria: 'Watch 1-8 min video, subscribe, and comment' },
        { name: 'Video 1-10min + Comment',             slug: 'yt-1-10m-comment',   defaultReward: 0.045, defaultCriteria: 'Watch 1-10 min video fully and leave positive comment' },
        { name: 'Video 1-10min + Subscribe + Comment', slug: 'yt-1-10m-sub-comment', defaultReward: 0.050, defaultCriteria: 'Watch 1-10 min video, subscribe, and comment' },
        { name: 'Video 1-15min + Comment',             slug: 'yt-1-15m-comment',   defaultReward: 0.070, defaultCriteria: 'Watch 1-15 min video fully and leave positive comment' },
        { name: 'Video 1-15min + Subscribe + Comment', slug: 'yt-1-15m-sub-comment', defaultReward: 0.075, defaultCriteria: 'Watch 1-15 min video, subscribe, and comment' },
        { name: 'Video 1-20min + Comment',             slug: 'yt-1-20m-comment',   defaultReward: 0.090, defaultCriteria: 'Watch 1-20 min video fully and leave positive comment' },
        { name: 'Video 1-20min + Subscribe + Comment', slug: 'yt-1-20m-sub-comment', defaultReward: 0.095, defaultCriteria: 'Watch 1-20 min video, subscribe, and comment' },
        { name: 'Video 1-25min + Comment',             slug: 'yt-1-25m-comment',   defaultReward: 0.110, defaultCriteria: 'Watch 1-25 min video fully and leave positive comment' },
        { name: 'Video 1-25min + Subscribe + Comment', slug: 'yt-1-25m-sub-comment', defaultReward: 0.115, defaultCriteria: 'Watch 1-25 min video, subscribe, and comment' },
        { name: 'Video 1-30min + Comment',             slug: 'yt-1-30m-comment',   defaultReward: 0.132, defaultCriteria: 'Watch 1-30 min video fully and leave positive comment' },
        { name: 'Video 1-30min + Subscribe + Comment', slug: 'yt-1-30m-sub-comment', defaultReward: 0.140, defaultCriteria: 'Watch 1-30 min video, subscribe, and comment' },
        { name: 'Views + Positive Comment',            slug: 'yt-views-comment',   defaultReward: 0.027, defaultCriteria: 'Watch video and leave positive comment' },
        { name: 'Like + Comment',                      slug: 'yt-like-comment',    defaultReward: 0.032, defaultCriteria: 'Like video and leave a comment' },
        { name: 'Comment + Share',                     slug: 'yt-comment-share',   defaultReward: 0.042, defaultCriteria: 'Comment on video and share on social media' },
        { name: 'Video Like + Positive Comment',       slug: 'yt-like-pos-comment', defaultReward: 0.030, defaultCriteria: 'Like video and leave a detailed positive comment' },
      ],
    },
  ];

  for (let i = 0; i < categoryDefs.length; i++) {
    const catDef = categoryDefs[i];
    const { subcategories: subDefs, ...catData } = catDef;

    // Upsert category
    const category = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: { name: catData.name, description: catData.description, icon: catData.icon, isActive: true },
      create: { ...catData, sortOrder: i },
    });

    // Upsert subcategories
    for (let j = 0; j < subDefs.length; j++) {
      const sub = subDefs[j];
      const existingSub = await prisma.subcategory.findFirst({
        where: { categoryId: category.id, slug: sub.slug },
      });
      if (existingSub) {
        await prisma.subcategory.update({
          where: { id: existingSub.id },
          data: { name: sub.name, defaultReward: sub.defaultReward, defaultCriteria: sub.defaultCriteria, isActive: true },
        });
      } else {
        await prisma.subcategory.create({
          data: {
            categoryId: category.id,
            name: sub.name,
            slug: sub.slug,
            description: sub.defaultCriteria,
            defaultReward: sub.defaultReward,
            defaultCriteria: sub.defaultCriteria,
            sortOrder: j,
          },
        });
      }
    }
  }
  console.log('✅ Categories & subcategories seeded');

  // ─── Countries ───────────────────────────────────
  const countries = [
    { name: 'United States', code: 'US', region: 'North America' },
    { name: 'United Kingdom', code: 'GB', region: 'Europe' },
    { name: 'India', code: 'IN', region: 'Asia' },
    { name: 'Bangladesh', code: 'BD', region: 'Asia' },
    { name: 'Pakistan', code: 'PK', region: 'Asia' },
    { name: 'Nigeria', code: 'NG', region: 'Africa' },
    { name: 'Philippines', code: 'PH', region: 'Asia' },
    { name: 'Indonesia', code: 'ID', region: 'Asia' },
    { name: 'Kenya', code: 'KE', region: 'Africa' },
    { name: 'Ghana', code: 'GH', region: 'Africa' },
    { name: 'Brazil', code: 'BR', region: 'South America' },
    { name: 'Mexico', code: 'MX', region: 'North America' },
    { name: 'Canada', code: 'CA', region: 'North America' },
    { name: 'Australia', code: 'AU', region: 'Oceania' },
    { name: 'Germany', code: 'DE', region: 'Europe' },
    { name: 'France', code: 'FR', region: 'Europe' },
    { name: 'Turkey', code: 'TR', region: 'Asia' },
    { name: 'Egypt', code: 'EG', region: 'Africa' },
    { name: 'Malaysia', code: 'MY', region: 'Asia' },
    { name: 'Vietnam', code: 'VN', region: 'Asia' },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { code: country.code },
      update: {},
      create: country,
    });
  }
  console.log('✅ Countries seeded');

  // ─── Test Users ──────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskhive.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@taskhive.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      referralCode: 'ADMINREF',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // Test Worker
  const worker = await prisma.user.upsert({
    where: { email: 'worker@test.com' },
    update: {},
    create: {
      name: 'Test Worker',
      email: 'worker@test.com',
      passwordHash,
      role: 'WORKER',
      status: 'ACTIVE',
      referralCode: 'WRKTEST',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.wallet.upsert({
    where: { userId: worker.id },
    update: {},
    create: { userId: worker.id, availableBalance: 5.0 },
  });

  // Test Employer
  const employer = await prisma.user.upsert({
    where: { email: 'employer@test.com' },
    update: {},
    create: {
      name: 'Test Employer',
      email: 'employer@test.com',
      passwordHash,
      role: 'EMPLOYER',
      status: 'ACTIVE',
      referralCode: 'EMPTEST',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.wallet.upsert({
    where: { userId: employer.id },
    update: {},
    create: { userId: employer.id, depositBalance: 100.0 },
  });

  console.log('✅ Test users seeded:');
  console.log('   Admin:    admin@taskhive.com / password123');
  console.log('   Worker:   worker@test.com / password123');
  console.log('   Employer: employer@test.com / password123');

  // ─── Sample Job ──────────────────────────────────
  const ytCat = await prisma.category.findUnique({ where: { slug: 'youtube' } });
  const ytSub = ytCat ? await prisma.subcategory.findFirst({ where: { categoryId: ytCat.id, slug: 'yt-1-5m-sub-comment' } }) : null;
  const existingJob = await prisma.job.findFirst({ where: { employerId: employer.id } });

  if (!existingJob && ytCat) {
    const reward = ytSub ? parseFloat(ytSub.defaultReward) : 0.03;
    const workers = 100;
    const baseWorkerBudget = reward * workers;       // $3.00
    const platformFeePercent = 10;
    const platformFeeAmount = baseWorkerBudget * (platformFeePercent / 100); // $0.30
    const screenshotFeePercent = 3;
    const screenshotFeeAmount = baseWorkerBudget * (screenshotFeePercent / 100); // $0.09
    const totalCharge = baseWorkerBudget + platformFeeAmount + screenshotFeeAmount; // $3.39

    await prisma.job.create({
      data: {
        employerId: employer.id,
        categoryId: ytCat.id,
        subcategoryId: ytSub?.id || null,
        title: 'Watch YouTube Video (1-5 min) + Subscribe + Comment',
        shortDescription: 'Watch our video, subscribe to the channel and leave a positive comment',
        instructions: '1. Go to the provided YouTube video link\n2. Watch the entire video (minimum 1-5 minutes)\n3. Subscribe to the channel\n4. Leave a positive, relevant comment\n5. Take a screenshot of the comment posted',
        proofRequirements: 'Submit a screenshot clearly showing your comment posted with your account username visible, and another screenshot showing the Subscribe button is active',
        proofTypes: 'IMAGE',
        requiresScreenshot: true,
        targetUrl: 'https://youtube.com/@taskhive_demo',
        rewardPerWorker: reward,
        totalWorkers: workers,
        estimatedDays: 3,
        baseWorkerBudget,
        platformFeePercent,
        platformFeeAmount,
        screenshotFeePercent,
        screenshotFeeAmount,
        totalCharge,
        platformFee: platformFeeAmount + screenshotFeeAmount,
        status: 'ACTIVE',
        publishedAt: new Date(),
        estimatedCompletionAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        targets: {
          create: { targetType: 'GLOBAL' },
        },
      },
    });

    // Deduct from employer wallet
    await prisma.wallet.update({
      where: { userId: employer.id },
      data: {
        depositBalance: { decrement: totalCharge },
        lockedBalance: { increment: totalCharge },
      },
    });

    console.log('✅ Sample YouTube job created');
  }

  console.log('\n🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
