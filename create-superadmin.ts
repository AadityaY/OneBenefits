import { db } from "./server/db";
import { users } from "./shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  console.log("Creating superadmin user...");

  const hashedPassword = await hashPassword("password");
  
  // Create superadmin
  const [superadmin] = await db.insert(users).values({
    username: "superadmin",
    password: hashedPassword,
    email: "superadmin@example.com",
    role: "superadmin",
    companyId: null, // Superadmin doesn't belong to any specific company
    firstName: "Super",
    lastName: "Admin",
    profileImage: ""
  }).returning();
  
  console.log(`Created superadmin user: superadmin (ID: ${superadmin.id})`);
  console.log("Password: password");
  
  process.exit(0);
}

main().catch(error => {
  console.error("Error creating superadmin:", error);
  process.exit(1);
});