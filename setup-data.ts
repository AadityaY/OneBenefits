import { db } from './server/db';
import { companies, users, companySettings } from './shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  try {
    // Create default company
    const [company] = await db.insert(companies).values({
      name: 'Demo Company',
      slug: 'demo',
      status: 'active'
    }).returning();
    console.log('Created company:', company);

    // Create super admin user
    const [superAdmin] = await db.insert(users).values({
      username: 'superadmin',
      password: await hashPassword('password'),
      email: 'superadmin@example.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      active: true
    }).returning();
    console.log('Created superadmin:', superAdmin);

    // Create company admin
    const [admin] = await db.insert(users).values({
      username: 'admin',
      password: await hashPassword('password'),
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      companyId: company.id,
      active: true
    }).returning();
    console.log('Created admin:', admin);

    // Create regular user
    const [user] = await db.insert(users).values({
      username: 'user',
      password: await hashPassword('password'),
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      role: 'user',
      companyId: company.id,
      active: true
    }).returning();
    console.log('Created user:', user);

    // Create company settings
    const [settings] = await db.insert(companySettings).values({
      name: company.name,
      companyId: company.id,
      primaryColor: '#0f766e',
      secondaryColor: '#0369a1',
      accentColor: '#7c3aed',
    }).returning();
    console.log('Created company settings:', settings);

    console.log('Initial data setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up initial data:', error);
    process.exit(1);
  }
}

main();