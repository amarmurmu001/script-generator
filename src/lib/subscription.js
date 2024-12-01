import { db } from './firebase';
import { collection, doc, setDoc, getDoc, updateDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

const PLAN_DETAILS = {
  'Free': {
    name: 'Free',
    limit: 5,
    limitType: 'total',
    features: [
      '5 scripts total',
      'Basic support',
      'Standard templates'
    ]
  },
  'Starter': {
    name: 'Starter',
    limit: 50,
    limitType: 'daily',
    features: [
      '50 scripts per day',
      '5 themes',
      'Basic support',
      '24/7 email support',
      'Access to basic templates'
    ]
  },
  'Pro': {
    name: 'Pro',
    limit: 200,
    limitType: 'daily',
    features: [
      'Unlimited scripts',
      'All themes',
      'Priority support',
      'Custom themes',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ]
  }
};

export async function addSubscriptionToFirestore(subscriptionData) {
  try {
    const planName = subscriptionData.planName || 'Free';
    const subscriptionRef = doc(db, "subscriptions", subscriptionData.subscriptionId);
    
    const subscriptionDoc = {
      ...subscriptionData,
      planName: planName,
      planDetails: PLAN_DETAILS[planName],
      status: subscriptionData.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentPeriodStart: subscriptionData.currentPeriodStart || new Date().toISOString(),
      currentPeriodEnd: subscriptionData.currentPeriodEnd || null,
      userId: subscriptionData.userId,
      razorpaySubscriptionId: subscriptionData.razorpaySubscriptionId
    };

    await setDoc(subscriptionRef, subscriptionDoc);

    // Also update the user's subscription document
    const userSubscriptionRef = doc(db, 'subscriptions', subscriptionData.userId);
    await setDoc(userSubscriptionRef, {
      ...subscriptionDoc,
      id: subscriptionData.subscriptionId
    }, { merge: true });

    return subscriptionDoc;
  } catch (error) {
    console.error("Error adding subscription:", error);
    throw error;
  }
}

export async function getUserSubscription(userId, forceRefresh = false) {
  try {
    // First try to get the user-specific subscription document
    const userSubscriptionRef = doc(db, 'subscriptions', userId);
    const userSubscriptionDoc = await getDoc(userSubscriptionRef);

    // If we have a valid subscription and not forcing refresh, return it
    if (userSubscriptionDoc.exists() && !forceRefresh) {
      const data = userSubscriptionDoc.data();
      if (data.planName && PLAN_DETAILS[data.planName]) {
        return {
          ...data,
          planDetails: PLAN_DETAILS[data.planName]
        };
      }
    }

    // If no valid subscription found or force refresh, check active subscriptions
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = query(
      subscriptionsRef,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const activeSubscription = querySnapshot.docs[0]?.data();

    if (activeSubscription && activeSubscription.planName) {
      const updatedSubscription = {
        ...activeSubscription,
        userId: userId,
        planDetails: PLAN_DETAILS[activeSubscription.planName],
        status: 'active',
        updatedAt: new Date().toISOString()
      };

      // Update the user's subscription document
      await setDoc(userSubscriptionRef, updatedSubscription, { merge: true });
      return updatedSubscription;
    }

    // If no active subscription found, create/update with free plan
    const defaultSubscription = {
      userId: userId,
      planName: 'Free',
      planDetails: PLAN_DETAILS['Free'],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userSubscriptionRef, defaultSubscription, { merge: true });
    return defaultSubscription;

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    // Return default subscription in case of error
    return {
      userId: userId,
      planName: 'Free',
      planDetails: PLAN_DETAILS['Free'],
      status: 'active'
    };
  }
}

export async function updateSubscriptionStatus(subscriptionId, status, planName, periodEnd) {
  try {
    const subscriptionRef = doc(db, "subscriptions", subscriptionId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      throw new Error('Subscription not found');
    }

    const subscriptionData = subscriptionDoc.data();
    const updateData = {
      status,
      planName,
      planDetails: PLAN_DETAILS[planName],
      currentPeriodEnd: periodEnd,
      updatedAt: new Date().toISOString(),
    };

    // Update the subscription document
    await updateDoc(subscriptionRef, updateData);

    // Also update the user's subscription document
    const userSubscriptionRef = doc(db, 'subscriptions', subscriptionData.userId);
    await setDoc(userSubscriptionRef, {
      ...updateData,
      userId: subscriptionData.userId,
      subscriptionId: subscriptionId
    }, { merge: true });

  } catch (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
}

// Helper function to get plan details by name
export function getPlanDetails(planName) {
  return PLAN_DETAILS[planName] || PLAN_DETAILS['Free'];
}

export async function cancelSubscription(subscriptionId) {
  try {
    const subscriptionRef = doc(db, 'subscriptions', subscriptionId);
    
    // First check if subscription exists and is active
    const subscriptionDoc = await getDoc(subscriptionRef);
    if (!subscriptionDoc.exists()) {
      throw new Error('Subscription not found');
    }

    const subscriptionData = subscriptionDoc.data();
    const updateData = {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      planName: 'Free',
      planDetails: PLAN_DETAILS['Free']
    };

    // Update both subscription documents
    await updateDoc(subscriptionRef, updateData);
    
    // Update user's subscription document
    const userSubscriptionRef = doc(db, 'subscriptions', subscriptionData.userId);
    await setDoc(userSubscriptionRef, {
      ...updateData,
      userId: subscriptionData.userId,
      subscriptionId: subscriptionId
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
} 