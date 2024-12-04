import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Plan configurations
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    scriptLimit: 5,
    limitType: 'total',
    features: [
      'Generate up to 5 scripts',
      'Basic script templates',
      'Community support'
    ]
  },
  STARTER: {
    name: 'Starter',
    price: 499,
    scriptLimit: 50,
    limitType: 'daily',
    features: [
      'Generate up to 50 scripts per day',
      'Advanced script templates',
      'Priority support',
      'Custom script parameters',
      'Script history'
    ]
  },
  PRO: {
    name: 'Pro',
    price: 1999,
    scriptLimit: 200,
    limitType: 'daily',
    features: [
      'Generate up to 200 scripts per day',
      'All Starter features',
      'Premium script templates',
      'Priority support',
      'Advanced customization',
      'API access',
      'Team collaboration'
    ]
  }
};

/**
 * Get user's subscription details
 * @param {string} userId - The user's ID
 * @param {boolean} includeDetails - Whether to include detailed plan information
 * @returns {Promise<Object>} - The subscription details
 */
export async function getUserSubscription(userId, includeDetails = false) {
  try {
    // First try to find active subscription with sub_ prefix
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(
      subscriptionsRef,
      where("userId", "==", userId),
      where("status", "in", ["active", "trialing"]),
      where("subscriptionId", ">=", "sub_"),
      where("subscriptionId", "<=", "sub_\uf8ff")
    );
    
    const querySnapshot = await getDocs(q);
    let subscriptionDoc = null;

    if (!querySnapshot.empty) {
      // Get the most recent active subscription
      subscriptionDoc = querySnapshot.docs.reduce((latest, current) => {
        if (!latest) return current;
        return new Date(current.data().createdAt) > new Date(latest.data().createdAt) ? current : latest;
      }, null);
    }

    // If no sub_ subscription found, check for legacy subscription
    if (!subscriptionDoc) {
      const directDocRef = doc(db, "subscriptions", userId);
      const directDoc = await getDoc(directDocRef);
      if (directDoc.exists() && directDoc.data().status === "active") {
        subscriptionDoc = directDoc;
      }
    }

    // If no subscription found, return free plan details
    if (!subscriptionDoc) {
      return {
        userId,
        planName: 'Free',
        status: 'active',
        ...(includeDetails ? { planDetails: PLANS.FREE } : {})
      };
    }

    const subscriptionData = subscriptionDoc.data();
    
    // Handle case-insensitive plan name matching
    const planKey = Object.keys(PLANS).find(
      key => key.toLowerCase() === subscriptionData.planName?.toLowerCase()
    ) || 'FREE';
    
    return {
      ...subscriptionData,
      id: subscriptionDoc.id,
      planName: PLANS[planKey].name, // Use standardized plan name
      ...(includeDetails ? { planDetails: PLANS[planKey] } : {})
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    // Return free plan as fallback
    return {
      userId,
      planName: 'Free',
      status: 'active',
      ...(includeDetails ? { planDetails: PLANS.FREE } : {})
    };
  }
}

/**
 * Check if user has an active subscription
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - Whether the user has an active subscription
 */
export async function hasActiveSubscription(userId) {
  try {
    const subscription = await getUserSubscription(userId);
    return subscription.status === 'active' || subscription.status === 'trialing';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Get user's current plan details
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - The plan details
 */
export async function getCurrentPlan(userId) {
  try {
    const subscription = await getUserSubscription(userId, true);
    const planKey = subscription.planName?.toUpperCase() || 'FREE';
    return PLANS[planKey] || PLANS.FREE;
  } catch (error) {
    console.error('Error getting current plan:', error);
    return PLANS.FREE;
  }
}

/**
 * Check if user can generate more scripts
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - Whether the user can generate more scripts
 */
export async function canGenerateScript(userId) {
  try {
    const subscription = await getUserSubscription(userId, true);
    const planKey = subscription.planName?.toUpperCase() || 'FREE';
    const plan = PLANS[planKey] || PLANS.FREE;
    
    // For free plan, check total scripts generated
    if (planKey === 'FREE') {
      const scriptsRef = collection(db, "scripts");
      const q = query(scriptsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.size < plan.scriptLimit;
    }
    
    // For paid plans, check daily limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const scriptsRef = collection(db, "scripts");
    const q = query(
      scriptsRef,
      where("userId", "==", userId),
      where("createdAt", ">=", today)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size < plan.scriptLimit;
  } catch (error) {
    console.error('Error checking script generation limit:', error);
    return false;
  }
} 