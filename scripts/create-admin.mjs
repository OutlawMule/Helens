// Secure first-admin setup. Run locally:  npm run create-admin
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local, then asks for an email and a
// password at the prompt. No password is ever stored in the repository or passed on the command line.
//
// By default it refuses to run if an admin already exists. Pass --allow-additional to add another one.
import readline from 'node:readline'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Fill in .env.local first.')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    if (hidden) {
      rl._writeToOutput = (s) => process.stdout.write(s.includes(question) ? s : s.trim() ? '*' : s)
    }
    rl.question(question, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer.trim())
    })
  })
}

const { count, error: countError } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
if (countError) {
  console.error('Could not read profiles. Have you run the SQL migrations?\n', countError.message)
  process.exit(1)
}
if ((count ?? 0) > 0 && !process.argv.includes('--allow-additional')) {
  console.error(`An administrator already exists. Re-run with --allow-additional if you really want another one.`)
  process.exit(1)
}

const email = (await ask('Admin email: ')).toLowerCase()
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('That does not look like an email address.')
  process.exit(1)
}
const password = await ask('Password (min 12 characters): ', true)
const confirm = await ask('Repeat password: ', true)
if (password !== confirm) {
  console.error('Passwords do not match.')
  process.exit(1)
}
if (password.length < 12) {
  console.error('Use at least 12 characters.')
  process.exit(1)
}

let userId
const created = await db.auth.admin.createUser({ email, password, email_confirm: true })
if (created.error) {
  if (!/already|registered|exists/i.test(created.error.message)) {
    console.error('Could not create the user:', created.error.message)
    process.exit(1)
  }
  const list = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  userId = list.data?.users.find((u) => u.email?.toLowerCase() === email)?.id
  if (!userId) {
    console.error('That email is registered but could not be found. Promote it with the SQL in the README instead.')
    process.exit(1)
  }
  await db.auth.admin.updateUserById(userId, { password })
} else {
  userId = created.data.user.id
}

const { error } = await db.from('profiles').upsert({ id: userId, email, role: 'admin' })
if (error) {
  console.error('User created, but granting the admin role failed:', error.message)
  process.exit(1)
}
console.log(`\nDone. ${email} can now sign in at /admin/login.`)
console.log('Reminder: in Supabase → Authentication → Sign In / Providers, switch OFF "Allow new users to sign up".')
