import bcrypt from 'bcryptjs'
import { db } from '@/libs/db'

// Dev-only helper: SuperAdmin has no self-signup route, so a first account
// must be seeded manually. Usage: bun run scripts/seed-superadmin.ts <email> <password>
const seedSuperAdmin = async () => {
  const [email, password] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Usage: bun run scripts/seed-superadmin.ts <email> <password>')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const superAdmin = await db.superAdmin.upsert({
    where: { email },
    update: { password: hashedPassword },
    create: { email, password: hashedPassword, name: 'Super Admin' },
  })

  console.log(`SuperAdmin ready: ${superAdmin.email}`)
}

seedSuperAdmin()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
