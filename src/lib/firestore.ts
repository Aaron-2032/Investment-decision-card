// Firestore 資料存取層（Data Access Layer）
// 所有對資料庫的讀寫操作都封裝在這裡，頁面元件只需呼叫這些函式即可
// 資料結構：users/{userId}/decisions/{id}  /reviews/{id}
//                         /notes/{id}

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  Decision,
  DecisionInput,
  Review,
  ReviewInput,
  QuickNote,
  QuickNoteInput,
} from './types'

// ─── Decisions ────────────────────────────────────────────────────────────────
// 決策卡的 CRUD：新增、修改、刪除、查詢單筆、查詢清單

// 取得該使用者的 decisions 子集合參照（每位用戶資料完全隔離）
const decisionsCol = (userId: string) =>
  collection(db, 'users', userId, 'decisions')

export async function createDecision(
  userId: string,
  input: DecisionInput,
): Promise<Decision> {
  const ref = await addDoc(decisionsCol(userId), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return { id: ref.id, ...snap.data() } as Decision
}

export async function updateDecision(
  userId: string,
  id: string,
  partial: Partial<DecisionInput>,
): Promise<void> {
  const ref = doc(db, 'users', userId, 'decisions', id)
  await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() })
}

export async function deleteDecision(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'decisions', id))
}

export async function getDecision(
  userId: string,
  id: string,
): Promise<Decision | null> {
  const snap = await getDoc(doc(db, 'users', userId, 'decisions', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Decision
}

export async function listDecisions(userId: string): Promise<Decision[]> {
  const q = query(
    decisionsCol(userId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Decision)
}

export async function listDecisionsByStatus(
  userId: string,
  status: Decision['status'],
): Promise<Decision[]> {
  const q = query(
    decisionsCol(userId),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Decision)
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
// 複盤紀錄存放在 decisions/{id}/reviews/ 子集合中，與決策卡緊密關聯

const reviewsCol = (userId: string, decisionId: string) =>
  collection(db, 'users', userId, 'decisions', decisionId, 'reviews')

export async function createReview(
  userId: string,
  decisionId: string,
  input: ReviewInput,
): Promise<Review> {
  const ref = await addDoc(reviewsCol(userId, decisionId), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return { id: ref.id, ...snap.data() } as Review
}

export async function getReview(
  userId: string,
  decisionId: string,
  reviewId: string,
): Promise<Review | null> {
  const snap = await getDoc(
    doc(db, 'users', userId, 'decisions', decisionId, 'reviews', reviewId),
  )
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Review
}

export async function listReviews(
  userId: string,
  decisionId: string,
): Promise<Review[]> {
  const snap = await getDocs(reviewsCol(userId, decisionId))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Review)
}

// ─── Quick Notes ──────────────────────────────────────────────────────────────
// 快速筆記存放在 users/{id}/notes/ 頂層集合，可選擇性連結到某張決策卡

const notesCol = (userId: string) =>
  collection(db, 'users', userId, 'notes')

export async function createNote(
  userId: string,
  input: QuickNoteInput,
): Promise<QuickNote> {
  const ref = await addDoc(notesCol(userId), {
    ...input,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const snap = await getDoc(ref)
  return { id: ref.id, ...snap.data() } as QuickNote
}

export async function updateNote(
  userId: string,
  id: string,
  partial: Partial<QuickNoteInput>,
): Promise<void> {
  const ref = doc(db, 'users', userId, 'notes', id)
  await updateDoc(ref, { ...partial, updatedAt: serverTimestamp() })
}

export async function deleteNote(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'notes', id))
}

export async function listNotes(userId: string): Promise<QuickNote[]> {
  const q = query(notesCol(userId), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QuickNote)
}

export async function listNotesForDecision(
  userId: string,
  decisionId: string,
): Promise<QuickNote[]> {
  const q = query(
    notesCol(userId),
    where('decisionId', '==', decisionId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as QuickNote)
}

// ─── PnL helpers ─────────────────────────────────────────────────────────────
// 純函式（Pure Functions）：計算損益，不依賴資料庫，方便單元測試

// 計算損益金額（絕對值）
// 做多：(現價 - 成本) × 股數；做空方向相反
export function calcPnL(
  direction: Decision['direction'],
  entryPrice: number,
  referencePrice: number,
  positionSize: number,
  positionUnit: Decision['positionUnit'],
): number {
  const shares =
    positionUnit === 'shares'
      ? positionSize
      : positionSize / entryPrice

  const raw = (referencePrice - entryPrice) * shares
  return direction === 'short' ? -raw : raw
}

// 計算損益百分比（報酬率）
export function calcPnLPct(
  direction: Decision['direction'],
  entryPrice: number,
  referencePrice: number,
): number {
  const raw = ((referencePrice - entryPrice) / entryPrice) * 100
  return direction === 'short' ? -raw : raw
}

// 計算持有天數：從進場日到出場日（或今天）
export function holdingDays(
  entryDate: Timestamp,
  exitDate: Timestamp | null,
): number {
  const end = exitDate ? exitDate.toDate() : new Date()
  const diff = end.getTime() - entryDate.toDate().getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
