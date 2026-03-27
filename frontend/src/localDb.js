const DB_KEY_PREFIX = 'aqro_localdb_'

export const db = {}
export const storage = {}
export const googleProvider = { providerId: 'google.com' }

const AUTH_KEY = 'aqro_auth_user'
const snapshotListeners = new Set()
let storageBridgeBound = false

export const auth = {
  get currentUser() {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
}

function nowIso() {
  return new Date().toISOString()
}

function collKey(name) {
  return `${DB_KEY_PREFIX}${name}`
}

function collectionNameFromRef(refOrQuery) {
  if (!refOrQuery) return null
  if (refOrQuery.kind === 'collection') return refOrQuery.name
  if (refOrQuery.kind === 'query') return refOrQuery.collection?.name ?? null
  return null
}

function emitSnapshot(listener) {
  Promise.resolve()
    .then(() => getDocs(listener.refOrQuery))
    .then((snapshot) => listener.onNext(snapshot))
    .catch((err) => listener.onError && listener.onError(err))
}

function notifySnapshotListeners(changedCollection) {
  snapshotListeners.forEach((listener) => {
    if (!listener.collectionName || listener.collectionName === changedCollection) {
      emitSnapshot(listener)
    }
  })
}

function ensureStorageBridge() {
  if (storageBridgeBound || typeof window === 'undefined') return
  window.addEventListener('storage', (event) => {
    if (!event?.key || !event.key.startsWith(DB_KEY_PREFIX)) return
    const changedCollection = event.key.slice(DB_KEY_PREFIX.length)
    if (!changedCollection) return
    notifySnapshotListeners(changedCollection)
  })
  storageBridgeBound = true
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
  notifySnapshotListeners(name)
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function normalizeId(id) {
  return String(id)
}

function makeId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

function applyDataPatch(target, patch) {
  for (const [key, value] of Object.entries(patch || {})) {
    if (value && typeof value === 'object' && value.__op === 'increment') {
      target[key] = Number(target[key] || 0) + Number(value.value || 0)
    } else {
      target[key] = value
    }
  }
}

function matchWhere(item, condition) {
  const { field, op, value } = condition
  const current = field.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), item)

  if (op === '==') return current === value
  if (op === 'in') return Array.isArray(value) && value.includes(current)
  return true
}

function compareOrder(a, b, order) {
  const av = order.field.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), a)
  const bv = order.field.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), b)
  if (av === bv) return 0
  const asc = order.direction !== 'desc'
  if (av == null) return asc ? 1 : -1
  if (bv == null) return asc ? -1 : 1
  if (av > bv) return asc ? 1 : -1
  return asc ? -1 : 1
}

function makeDocSnapshot(item, collectionName, id) {
  const normalizedId = normalizeId(id)
  const data = clone(item)
  return {
    id: normalizedId,
    exists: () => true,
    data: () => data,
    ref: { kind: 'doc', collection: collectionName, id: normalizedId },
  }
}

function makeMissingSnapshot(collectionName, id) {
  const normalizedId = normalizeId(id)
  return {
    id: normalizedId,
    exists: () => false,
    data: () => undefined,
    ref: { kind: 'doc', collection: collectionName, id: normalizedId },
  }
}

function executeQuery(refOrQuery) {
  if (!refOrQuery) return []

  let collectionName = ''
  let rows = []
  let conditions = []
  let orders = []
  let max = null

  if (refOrQuery.kind === 'collection') {
    collectionName = refOrQuery.name
    rows = readCollection(collectionName)
  } else if (refOrQuery.kind === 'query') {
    collectionName = refOrQuery.collection.name
    rows = readCollection(collectionName)
    conditions = refOrQuery.conditions
    orders = refOrQuery.orders
    max = refOrQuery.max
  } else {
    return []
  }

  let result = rows
  if (conditions.length) {
    result = result.filter((item) => conditions.every((c) => matchWhere(item, c)))
  }
  if (orders.length) {
    result = [...result].sort((a, b) => {
      for (const order of orders) {
        const cmp = compareOrder(a, b, order)
        if (cmp !== 0) return cmp
      }
      return 0
    })
  }
  if (typeof max === 'number') {
    result = result.slice(0, max)
  }

  return result.map((item) => makeDocSnapshot(item, collectionName, item.id || item._id || makeId(collectionName)))
}

export function serverTimestamp() {
  return nowIso()
}

export function increment(value) {
  return { __op: 'increment', value: Number(value || 0) }
}

export function doc(_db, collectionName, id) {
  return { kind: 'doc', collection: collectionName, id: normalizeId(id) }
}

export function collection(_db, collectionName) {
  return { kind: 'collection', name: collectionName }
}

export function where(field, op, value) {
  return { kind: 'where', field, op, value }
}

export function orderBy(field, direction = 'asc') {
  return { kind: 'orderBy', field, direction }
}

export function limit(count) {
  return { kind: 'limit', count: Number(count || 0) }
}

export function query(collectionRef, ...clauses) {
  const conditions = clauses.filter((c) => c?.kind === 'where')
  const orders = clauses.filter((c) => c?.kind === 'orderBy')
  const lim = clauses.find((c) => c?.kind === 'limit')

  return {
    kind: 'query',
    collection: collectionRef,
    conditions,
    orders,
    max: lim ? lim.count : null,
  }
}

export async function getDoc(docRef) {
  const rows = readCollection(docRef.collection)
  const found = rows.find((item) => normalizeId(item.id || item._id) === docRef.id)
  return found ? makeDocSnapshot(found, docRef.collection, docRef.id) : makeMissingSnapshot(docRef.collection, docRef.id)
}

export async function getDocs(refOrQuery) {
  const docs = executeQuery(refOrQuery)
  return { docs }
}

export async function setDoc(docRef, data, options = {}) {
  const rows = readCollection(docRef.collection)
  const index = rows.findIndex((item) => normalizeId(item.id || item._id) === docRef.id)

  if (index >= 0) {
    const next = clone(rows[index])
    if (options.merge) {
      applyDataPatch(next, data)
    } else {
      Object.keys(next).forEach((key) => delete next[key])
      applyDataPatch(next, data)
    }
    next.id = docRef.id
    rows[index] = next
  } else {
    const next = { id: docRef.id }
    applyDataPatch(next, data)
    rows.push(next)
  }

  writeCollection(docRef.collection, rows)
}

export async function updateDoc(docRef, patch) {
  const rows = readCollection(docRef.collection)
  const index = rows.findIndex((item) => normalizeId(item.id || item._id) === docRef.id)
  if (index < 0) {
    throw new Error(`Document not found: ${docRef.collection}/${docRef.id}`)
  }
  const next = clone(rows[index])
  applyDataPatch(next, patch)
  next.id = docRef.id
  rows[index] = next
  writeCollection(docRef.collection, rows)
}

export async function deleteDoc(docRef) {
  const rows = readCollection(docRef.collection)
  const next = rows.filter((item) => normalizeId(item.id || item._id) !== docRef.id)
  writeCollection(docRef.collection, next)
}

export async function addDoc(collectionRef, data) {
  const id = makeId(collectionRef.name)
  const rows = readCollection(collectionRef.name)
  const next = { id }
  applyDataPatch(next, data)
  rows.push(next)
  writeCollection(collectionRef.name, rows)
  return { id, ...next }
}

export function writeBatch() {
  const ops = []
  return {
    delete(ref) {
      ops.push({ type: 'delete', ref })
    },
    async commit() {
      for (const op of ops) {
        if (op.type === 'delete') {
          const rows = readCollection(op.ref.collection)
          const next = rows.filter((item) => normalizeId(item.id || item._id) !== op.ref.id)
          writeCollection(op.ref.collection, next)
        }
      }
    },
  }
}

export function onSnapshot(refOrQuery, onNext, onError) {
  const listener = {
    refOrQuery,
    onNext,
    onError,
    collectionName: collectionNameFromRef(refOrQuery),
  }
  ensureStorageBridge()
  snapshotListeners.add(listener)
  emitSnapshot(listener)
  return () => snapshotListeners.delete(listener)
}

export async function runTransaction(_db, updateFunction) {
  const tx = {
    async get(ref) {
      return getDoc(ref)
    },
    update(ref, patch) {
      return updateDoc(ref, patch)
    },
    set(ref, data, options) {
      return setDoc(ref, data, options)
    },
  }
  return updateFunction(tx)
}

export async function signOut() {
  localStorage.removeItem(AUTH_KEY)
}

function saveAuthUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

function ensureUsersCollectionUser(email, name = '', role = 'citizen') {
  const users = readCollection('users')
  const normalizedEmail = String(email).trim().toLowerCase()
  let user = users.find((u) => u.email === normalizedEmail)
  if (!user) {
    const uid = makeId('uid')
    user = {
      id: uid,
      uid: uid,
      email: normalizedEmail,
      name,
      role,
      created_at: nowIso(),
      updated_at: nowIso(),
      points: 0,
      cleared_complaints: 0,
      tokens: 0,
      total_complaints: 0,
    }
    users.push(user)
    writeCollection('users', users)
  }
  return user
}

export async function createUserWithEmailAndPassword(_auth, email, _password) {
  const user = ensureUsersCollectionUser(String(email).trim().toLowerCase(), '', 'citizen')
  saveAuthUser(user)
  return { user }
}

export async function signInWithEmailAndPassword(_auth, email, _password) {
  const user = ensureUsersCollectionUser(String(email).trim().toLowerCase(), '', 'citizen')
  saveAuthUser(user)
  return { user }
}

export async function signInWithPopup() {
  const email = `google_user_${Date.now()}@example.com`
  const user = ensureUsersCollectionUser(email, 'Google User')
  user.providerData = [{ providerId: 'google.com' }]
  user.displayName = user.name || 'Google User'
  saveAuthUser(user)
  return { user }
}

export function ref(_storage, path) {
  return { path }
}

export function uploadBytesResumable(storageReference, _file) {
  const task = {
    snapshot: { ref: storageReference },
    on(_event, progress, _error, complete) {
      if (progress) {
        progress({ bytesTransferred: 1, totalBytes: 1 })
      }
      if (complete) {
        complete()
      }
    },
  }
  return task
}

export async function uploadBytes(storageReference, _file) {
  return { ref: storageReference }
}

export async function getDownloadURL(storageReference) {
  return `local://storage/${storageReference.path}`
}

export async function deleteObject() {
  return
}
