import { collection, query, where, getDocs, Timestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getUserSubscription } from './subscription';

// Add caching for script limits
let limitsCache = new Map();

/**
 * Update the script limit for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - Whether the script can be generated
 */
export async function updateScriptLimit(userId) {
  try {
    const subscription = await getUserSubscription(userId, true);
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(
      subscriptionsRef,
      where("userId", "==", userId),
      where("status", "in", ["active", "trialing"])
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return false;
    }

    const subscriptionDoc = querySnapshot.docs[0];
    const subscriptionData = subscriptionDoc.data();
    const scriptLimit = subscriptionData.scriptLimit || {
      total: subscription.planDetails.scriptLimit,
      remaining: subscription.planDetails.scriptLimit,
      limitType: subscription.planDetails.limitType,
      lastReset: new Date().toISOString()
    };

    // Check if daily limit needs to be reset
    if (scriptLimit.limitType === 'daily') {
      const lastReset = new Date(scriptLimit.lastReset);
      const now = new Date();
      if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        scriptLimit.remaining = scriptLimit.total;
        scriptLimit.lastReset = now.toISOString();
      }
    }

    // Check if user has remaining scripts
    if (scriptLimit.remaining <= 0) {
      return false;
    }

    // Update the remaining count
    scriptLimit.remaining--;

    // Update Firestore
    await updateDoc(doc(db, "subscriptions", subscriptionDoc.id), {
      scriptLimit
    });

    // Update cache
    limitsCache.set(userId, scriptLimit);

    return true;
  } catch (error) {
    console.error('Error updating script limit:', error);
    return false;
  }
}

/**
 * Check script generation limit for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - The limit details
 */
export async function checkScriptGenerationLimit(userId) {
  try {
    // Check cache first
    if (limitsCache.has(userId)) {
      const cachedLimit = limitsCache.get(userId);
      const lastReset = new Date(cachedLimit.lastReset);
      const now = new Date();
      
      // If it's a daily limit and the day has changed, invalidate cache
      if (cachedLimit.limitType === 'daily' && 
          (lastReset.getDate() !== now.getDate() || 
           lastReset.getMonth() !== now.getMonth() || 
           lastReset.getFullYear() !== now.getFullYear())) {
        limitsCache.delete(userId);
      } else {
        return cachedLimit;
      }
    }

    const subscription = await getUserSubscription(userId, true);
    const subscriptionsRef = collection(db, "subscriptions");
    const q = query(
      subscriptionsRef,
      where("userId", "==", userId),
      where("status", "in", ["active", "trialing"])
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      const defaultLimit = {
        total: subscription.planDetails.scriptLimit,
        remaining: subscription.planDetails.scriptLimit,
        limitType: subscription.planDetails.limitType,
        lastReset: new Date().toISOString()
      };
      limitsCache.set(userId, defaultLimit);
      return defaultLimit;
    }

    const subscriptionDoc = querySnapshot.docs[0];
    const subscriptionData = subscriptionDoc.data();
    const scriptLimit = subscriptionData.scriptLimit || {
      total: subscription.planDetails.scriptLimit,
      remaining: subscription.planDetails.scriptLimit,
      limitType: subscription.planDetails.limitType,
      lastReset: new Date().toISOString()
    };

    // Check if daily limit needs to be reset
    if (scriptLimit.limitType === 'daily') {
      const lastReset = new Date(scriptLimit.lastReset);
      const now = new Date();
      if (lastReset.getDate() !== now.getDate() || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
        scriptLimit.remaining = scriptLimit.total;
        scriptLimit.lastReset = now.toISOString();
        
        // Update Firestore
        await updateDoc(doc(db, "subscriptions", subscriptionDoc.id), {
          scriptLimit
        });
      }
    }

    // Update cache
    limitsCache.set(userId, scriptLimit);

    return scriptLimit;
  } catch (error) {
    console.error('Error checking script limit:', error);
    // Return free plan limits as fallback
    return {
      total: 5,
      remaining: 5,
      limitType: 'total',
      lastReset: new Date().toISOString()
    };
  }
} 