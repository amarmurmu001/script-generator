import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';

export async function getUserSubscription(userId) {
  try {
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(
      subscriptionsRef,
      where("userId", "==", userId),
      where("status", "in", ["active", "trialing"])
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const subData = querySnapshot.docs[0].data();
      return {
        ...subData,
        id: querySnapshot.docs[0].id
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting subscription:", error);
    throw error;
  }
}

export async function updateSubscriptionStatus(subscriptionId, status, periodEnd) {
  try {
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    await updateDoc(subscriptionRef, {
      status,
      currentPeriodEnd: periodEnd,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

export async function addSubscriptionToFirestore(subscriptionData) {
  try {
    const subscriptionRef = doc(db, "subscriptions", subscriptionData.subscriptionId);
    await setDoc(subscriptionRef, {
      ...subscriptionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding subscription:", error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId) {
  const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
  await updateDoc(subscriptionRef, {
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  });
} 