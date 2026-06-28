// IndexedDB service for storing large data (base64 files, extracted text, analysis results)

const DB_NAME = 'cv-matcher-db'
const DB_VERSION = 1

const STORES = {
  VACANCY: 'vacancy',
  CVS: 'cvs',
}

let db = null

/**
 * Open (or create) the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  if (db) return Promise.resolve(db)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      if (!database.objectStoreNames.contains(STORES.VACANCY)) {
        database.createObjectStore(STORES.VACANCY, { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains(STORES.CVS)) {
        database.createObjectStore(STORES.CVS, { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      db = event.target.result
      resolve(db)
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}

/**
 * Generic put (upsert) into a store.
 * @param {string} storeName
 * @param {object} data - must have an `id` field
 * @returns {Promise<void>}
 */
export async function dbPut(storeName, data) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    // Safely strip proxies before putting into IndexedDB
    const rawData = JSON.parse(JSON.stringify(data))
    const request = store.put(rawData)
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Generic get from a store by key.
 * @param {string} storeName
 * @param {string|number} key
 * @returns {Promise<any>}
 */
export async function dbGet(storeName, key) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.get(key)
    request.onsuccess = (e) => resolve(e.target.result ?? null)
    request.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Generic getAll from a store.
 * @param {string} storeName
 * @returns {Promise<any[]>}
 */
export async function dbGetAll(storeName) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = (e) => resolve(e.target.result)
    request.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Generic delete from a store by key.
 * @param {string} storeName
 * @param {string|number} key
 * @returns {Promise<void>}
 */
export async function dbDelete(storeName, key) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.delete(key)
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject(e.target.error)
  })
}

/**
 * Clear all records in a store.
 * @param {string} storeName
 * @returns {Promise<void>}
 */
export async function dbClear(storeName) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = (e) => reject(e.target.error)
  })
}

export { STORES }
