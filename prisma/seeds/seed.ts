import { PrismaClient, UserRole, MerchantStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (order matters for FK constraints)
  await prisma.outboxEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.idempotencyKey.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.report.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.scheduledJob.deleteMany();
  await prisma.user.deleteMany();
  await prisma.merchant.deleteMany();

  console.log('  ✓ Cleaned existing data');

  // Create Admin User
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  const adminUser = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'admin@nexuspay.com',
      passwordHash: adminHash,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  });
  console.log('  ✓ Created admin user:', adminUser.email);

  // Create Merchants
  const merchantsData = [
    {
      id: uuidv4(),
      name: 'TechCorp Solutions',
      email: 'billing@techcorp.com',
      phone: '+1-555-0101',
      website: 'https://techcorp.example.com',
      businessType: 'Technology',
      status: MerchantStatus.ACTIVE,
      country: 'US',
      currency: 'USD',
    },
    {
      id: uuidv4(),
      name: 'Global Retail Inc',
      email: 'payments@globalretail.com',
      phone: '+1-555-0102',
      website: 'https://globalretail.example.com',
      businessType: 'Retail',
      status: MerchantStatus.ACTIVE,
      country: 'US',
      currency: 'USD',
    },
    {
      id: uuidv4(),
      name: 'EuroCommerce GmbH',
      email: 'finance@eurocommerce.de',
      phone: '+49-30-555-0103',
      website: 'https://eurocommerce.example.de',
      businessType: 'E-Commerce',
      status: MerchantStatus.ACTIVE,
      country: 'DE',
      currency: 'EUR',
    },
  ];

  const merchants = [];
  for (const merchantData of merchantsData) {
    const apiKey = `mk_live_${crypto.randomBytes(16).toString('hex')}`;
    const apiSecret = crypto.randomBytes(32).toString('hex');
    const merchant = await prisma.merchant.create({
      data: {
        ...merchantData,
        apiKey,
        apiSecret,
        webhookUrl: `https://${merchantData.email.split('@')[1]}/webhooks/nexuspay`,
        webhookSecret: crypto.randomBytes(16).toString('hex'),
        monthlyVolume: Math.random() * 1000000,
        totalRevenue: Math.random() * 10000000,
      },
    });
    merchants.push(merchant);
  }
  console.log(`  ✓ Created ${merchants.length} merchants`);

  // Create Merchant Users
  const merchantHash = await bcrypt.hash('Merchant@123456', 12);
  for (const merchant of merchants) {
    await prisma.user.create({
      data: {
        id: uuidv4(),
        email: merchant.email,
        passwordHash: merchantHash,
        firstName: merchant.name.split(' ')[0],
        lastName: merchant.name.split(' ')[1] || 'User',
        role: UserRole.MERCHANT,
        emailVerified: true,
        merchantId: merchant.id,
      },
    });
  }
  console.log(`  ✓ Created merchant users`);

  // Create Support User
  const supportHash = await bcrypt.hash('Support@123456', 12);
  await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'support@nexuspay.com',
      passwordHash: supportHash,
      firstName: 'Support',
      lastName: 'Agent',
      role: UserRole.SUPPORT,
      emailVerified: true,
    },
  });
  console.log('  ✓ Created support user');

  // Create Customers for each merchant
  const customers = [];
  for (const merchant of merchants) {
    const customerData = [
      { firstName: 'Alice', lastName: 'Johnson', email: `alice.${merchant.id.slice(0, 6)}@example.com`, country: 'US' },
      { firstName: 'Bob', lastName: 'Smith', email: `bob.${merchant.id.slice(0, 6)}@example.com`, country: 'GB' },
      { firstName: 'Charlie', lastName: 'Brown', email: `charlie.${merchant.id.slice(0, 6)}@example.com`, country: 'CA' },
      { firstName: 'Diana', lastName: 'Wilson', email: `diana.${merchant.id.slice(0, 6)}@example.com`, country: 'AU' },
      { firstName: 'Edward', lastName: 'Davis', email: `edward.${merchant.id.slice(0, 6)}@example.com`, country: 'US' },
    ];
    for (const cd of customerData) {
      const customer = await prisma.customer.create({
        data: {
          id: uuidv4(),
          merchantId: merchant.id,
          ...cd,
          phone: '+1-555-' + Math.floor(Math.random() * 9000 + 1000),
        },
      });
      customers.push(customer);
    }
  }
  console.log(`  ✓ Created ${customers.length} customers`);

  // Create Payments with various statuses
  const paymentMethods = [PaymentMethod.CARD, PaymentMethod.BANK_TRANSFER, PaymentMethod.WALLET];
  const statuses = [PaymentStatus.SUCCESS, PaymentStatus.SUCCESS, PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.PENDING];
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  let paymentCount = 0;
  for (const customer of customers.slice(0, 10)) {
    const merchant = merchants.find(m => m.id === customer.merchantId)!;
    for (let i = 0; i < 5; i++) {
      const status = statuses[i % statuses.length];
      const amount = parseFloat((Math.random() * 10000 + 100).toFixed(2));
      const currency = currencies[Math.floor(Math.random() * currencies.length)];
      const idKey = await prisma.idempotencyKey.create({
        data: {
          id: uuidv4(),
          key: `idem_${uuidv4()}`,
          merchantId: merchant.id,
          requestHash: crypto.createHash('sha256').update(`${customer.id}:${amount}:${i}`).digest('hex'),
          expiresAt: new Date(Date.now() + 86400 * 1000),
        },
      });
      await prisma.payment.create({
        data: {
          id: uuidv4(),
          merchantId: merchant.id,
          customerId: customer.id,
          idempotencyKeyId: idKey.id,
          correlationId: `req_${uuidv4().replace(/-/g, '').slice(0, 20)}`,
          amount,
          currency,
          status,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          description: `Payment for order #${Math.floor(Math.random() * 100000)}`,
          fraudScore: parseFloat((Math.random() * 100).toFixed(2)),
          taxAmount: parseFloat((amount * 0.1).toFixed(2)),
          netAmount: parseFloat((amount * 0.9).toFixed(2)),
          processedAt: status === PaymentStatus.SUCCESS ? new Date() : null,
          metadata: { orderId: `ORD-${Math.floor(Math.random() * 100000)}` },
        },
      });
      paymentCount++;
    }
  }
  console.log(`  ✓ Created ${paymentCount} payments`);

  // Create Scheduled Jobs
  const scheduledJobs = [
    { name: 'payment-reconciliation', cron: '0 * * * *', description: 'Hourly payment reconciliation' },
    { name: 'merchant-summary', cron: '0 */3 * * *', description: 'Merchant summary every 3 hours' },
    { name: 'daily-report', cron: '0 0 * * *', description: 'Daily report generation' },
    { name: 'audit-cleanup', cron: '0 0 * * 0', description: 'Weekly audit log cleanup' },
    { name: 'monthly-archival', cron: '0 0 1 * *', description: 'Monthly data archival' },
    { name: 'fraud-threshold-check', cron: '*/15 * * * *', description: 'Fraud threshold detection every 15 minutes' },
  ];

  for (const job of scheduledJobs) {
    await prisma.scheduledJob.create({ data: { ...job, isEnabled: true } });
  }
  console.log(`  ✓ Created ${scheduledJobs.length} scheduled jobs`);

  console.log('\n✅ Database seed completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin:    admin@nexuspay.com / Admin@123456');
  console.log('  Merchant: billing@techcorp.com / Merchant@123456');
  console.log('  Support:  support@nexuspay.com / Support@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
