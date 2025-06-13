
'use server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface CanonicalProduct {
  id?: string;
  name: string;
  price: string;
  link: string;
  sourceUrl: string;
  approvedAt: any; // Firestore serverTimestamp will be used here
  createdAt: any; // Firestore serverTimestamp
}

const CANONICAL_PRODUCTS_COLLECTION = 'canonicalProducts';

export async function addCanonicalProduct(
  product: Omit<CanonicalProduct, 'id' | 'approvedAt' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, CANONICAL_PRODUCTS_COLLECTION), {
      ...product,
      approvedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding canonical product to Firestore:', error);
    throw new Error('Failed to save approved product.');
  }
}
