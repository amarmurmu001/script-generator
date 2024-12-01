import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';

export async function addSubscriptionToFirestore(subscriptionData) {
  const subscriptionRef = doc(db, 'subscriptions', subscriptionData.subscriptionId);
  await setDoc(subscriptionRef, subscriptionData);
}

export async function updateSubscriptionStatus(subscriptionId, status, periodEnd) {
  const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
  await updateDoc(subscriptionRef, {
    status,
    currentPeriodEnd: periodEnd,
    updatedAt: new Date().toISOString(),
  });
}

export async function getUserSubscription(userId) {
  const subscriptionsRef = collection(db, 'subscriptions');
  const q = query(
    subscriptionsRef, 
    where('userId', '==', userId),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);
  return snapshot.empty ? null : snapshot.docs[0].data();
}

export async function cancelSubscription(subscriptionId) {
  const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
  await updateDoc(subscriptionRef, {
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  });
} 