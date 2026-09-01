import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA7IjA1nzbYBN7QmwUVAurrjrWonk5dxTc",
  authDomain: "payment-request-automatic.firebaseapp.com",
  projectId: "payment-request-automatic",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class FirestoreClient {
  static async find<T extends { id: string }>(
    collectionName: string,
    filter: Record<string, any> = {}
  ): Promise<T[]> {
    const q = query(
      collection(db, collectionName),
      ...Object.entries(filter).map(([key, value]) => where(key, "==", value))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<T, "id">),
    })) as T[];
  }

  static async insertOne<T extends { id?: string }>(
    collectionName: string,
    data: Omit<T, "id">
  ): Promise<{ id: string }> {
    const docRef = await addDoc(collection(db, collectionName), data);
    return { id: docRef.id };
  }

  static async updateOne<T extends { id: string }>(
    collectionName: string,
    id: string,
    data: Partial<Omit<T, "id">>
  ): Promise<{ id: string }> {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, data);
    return { id };
  }

  static async deleteOne(
    collectionName: string,
    id: string
  ): Promise<{ id: string }> {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return { id };
  }
}
