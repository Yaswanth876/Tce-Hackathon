/**
 * Complete setup script for test accounts
 * Run in browser console to initialize accounts correctly
 */

export function setupTestAccounts() {
  const DB_KEY_PREFIX = 'aqro_localdb_'
  
  function collKey(name) {
    return `${DB_KEY_PREFIX}${name}`
  }
  
  function readCollection(name) {
    try {
      const raw = localStorage.getItem(collKey(name))
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  
  function writeCollection(name, items) {
    localStorage.setItem(collKey(name), JSON.stringify(items))
  }
  
  // Create new users array with both accounts
  const now = new Date().toISOString()
  const users = [
    {
      id: 'uid_citizen_001',
      uid: 'uid_citizen_001',
      email: 'user@gmail.com',
      name: 'Test Citizen User',
      role: 'citizen',
      created_at: now,
      updated_at: now,
      points: 0,
      cleared_complaints: 0,
      tokens: 0,
      total_complaints: 0,
    },
    {
      id: 'uid_municipality_001',
      uid: 'uid_municipality_001',
      email: 'officer@gmail.com',
      name: 'Municipality Officer',
      role: 'municipality',
      created_at: now,
      updated_at: now,
      points: 0,
      cleared_complaints: 0,
      tokens: 0,
      total_complaints: 0,
    },
  ]
  
  // Save users collection
  writeCollection('users', users)
  
  // Clear any existing auth session
  localStorage.removeItem('aqro_auth_user')
  
  console.log('✅ Account setup complete!')
  console.log('')
  console.log('📝 CITIZEN ACCOUNT:')
  console.log('   Email: user@gmail.com')
  console.log('   Password: 12345678')
  console.log('   Role: citizen')
  console.log('')
  console.log('👮 MUNICIPALITY OFFICER ACCOUNT:')
  console.log('   Email: officer@gmail.com')
  console.log('   Password: 12345678')
  console.log('   Role: municipality')
  console.log('')
  console.log('Ready to login!')
  
  return users
}

export function clearAllData() {
  const DB_KEY_PREFIX = 'aqro_localdb_'
  const keys = Object.keys(localStorage).filter(k => k.startsWith(DB_KEY_PREFIX))
  keys.forEach(k => localStorage.removeItem(k))
  localStorage.removeItem('aqro_auth_user')
  console.log('✅ All local data cleared')
}
