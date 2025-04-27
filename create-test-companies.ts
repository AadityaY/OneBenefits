import { db } from "./server/db";
import { companies, companySettings, users } from "./shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Creating test companies and users...");

  const hashedPassword = await hashPassword("password");

  // Create 3 companies
  const companyData = [
    {
      name: "Acme Corporation",
      slug: "acme",
      domain: "acme.com",
      address: "123 Business Rd, Corporate City, 12345"
    },
    {
      name: "TechSolutions Inc.",
      slug: "techsolutions",
      domain: "techsolutions.io",
      address: "456 Innovation Ave, Tech Valley, 67890"
    },
    {
      name: "HealthFirst Group",
      slug: "healthfirst",
      domain: "healthfirst.org",
      address: "789 Wellness Blvd, Careborough, 54321"
    }
  ];

  // Insert companies
  console.log("Inserting companies...");
  const createdCompanies = [];
  
  for (const company of companyData) {
    const [createdCompany] = await db.insert(companies).values(company).returning();
    createdCompanies.push(createdCompany);
    
    // Create company settings for each company
    await db.insert(companySettings).values({
      companyId: createdCompany.id,
      name: createdCompany.name,
      logo: "",
      primaryColor: "#4f46e5",
      secondaryColor: "#10b981",
      accentColor: "#f59e0b",
      aiAssistantName: `${createdCompany.name} Benefits Assistant`,
      heroTitle: `Welcome to ${createdCompany.name} Benefits Portal`,
      heroSubtitle: "Your One-Stop Shop for All Benefits Information",
      heroDescription: "Access all your benefits information, view documents, take surveys, and more in one convenient place.",
      heroImageUrl: "",
      address: company.address,
      phone: "",
      email: `benefits@${company.domain}`,
      website: `https://www.${company.domain}`
    }).returning();
    
    console.log(`Created company: ${createdCompany.name} (ID: ${createdCompany.id})`);
  }

  // Create admin and user accounts for each company
  console.log("\nCreating users...");
  
  for (let i = 0; i < createdCompanies.length; i++) {
    const companyId = createdCompanies[i].id;
    const adminNum = i + 1;
    const userNum = i + 1;
    
    // Create admin
    const [admin] = await db.insert(users).values({
      username: `admin${adminNum}`,
      password: hashedPassword,
      email: `admin${adminNum}@example.com`,
      role: "admin",
      companyId: companyId,
      firstName: `Admin`,
      lastName: `${adminNum}`,
      profileImage: ""
    }).returning();
    
    console.log(`Created admin user: admin${adminNum} (ID: ${admin.id}) for company ID ${companyId}`);
    
    // Create regular user
    const [user] = await db.insert(users).values({
      username: `user${userNum}`,
      password: hashedPassword,
      email: `user${userNum}@example.com`,
      role: "user",
      companyId: companyId,
      firstName: `User`,
      lastName: `${userNum}`,
      profileImage: ""
    }).returning();
    
    console.log(`Created regular user: user${userNum} (ID: ${user.id}) for company ID ${companyId}`);
  }

  console.log("\nSetup complete! The following accounts are available:");
  console.log("Admins: admin1, admin2, admin3 (password: password)");
  console.log("Users: user1, user2, user3 (password: password)");
  
  process.exit(0);
}

main().catch(error => {
  console.error("Error creating test data:", error);
  process.exit(1);
});