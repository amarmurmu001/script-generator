import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getUserSubscription } from './subscription';

// Add caching for script limits
let limitsCache = new Map();

export async function checkScriptGenerationLimit(userId) {
  const cacheKey = `${userId}_${new Date().toDateString()}`;
  
  // Return cached value if it exists and is less than 1 minute old
  const cached = limitsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }

  try {
    // Get user's subscription and plan details
    const subscription = await getUserSubscription(userId);
    console.log('Subscription data in checkScriptGenerationLimit:', subscription);

    if (!subscription || !subscription.planDetails) {
      console.error('Invalid subscription data:', subscription);
      // Create default subscription if none exists
      const defaultSubscription = await getUserSubscription(userId);
      return {
        canGenerate: true,
        remaining: defaultSubscription.planDetails.limit,
        total: defaultSubscription.planDetails.limit,
        planName: defaultSubscription.planName,
        limitType: defaultSubscription.planDetails.limitType
      };
    }

    const { planDetails } = subscription;
    console.log('Plan details:', planDetails);
    
    // For free users or total limit plans
    if (planDetails.limitType === 'total') {
      const scriptsRef = collection(db, 'scripts');
      const q = query(
        scriptsRef,
        where('userId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const totalScripts = querySnapshot.size;
      console.log('Total scripts count:', totalScripts);

      return {
        canGenerate: totalScripts < planDetails.limit,
        remaining: Math.max(0, planDetails.limit - totalScripts),
        total: planDetails.limit,
        planName: subscription.planName,
        limitType: planDetails.limitType,
        planDetails: planDetails
      };
    }

    // For paid users with daily limits
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const scriptsRef = collection(db, 'scripts');
    const q = query(
      scriptsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay))
    );

    const querySnapshot = await getDocs(q);
    const scriptsGeneratedToday = querySnapshot.size;

    const limits = {
      canGenerate: scriptsGeneratedToday < planDetails.limit,
      remaining: Math.max(0, planDetails.limit - scriptsGeneratedToday),
      total: planDetails.limit,
      planName: subscription.planName,
      planDetails: planDetails,
      limitType: planDetails.limitType
    };

    // Cache the result
    limitsCache.set(cacheKey, {
      data: limits,
      timestamp: Date.now()
    });

    return limits;
  } catch (error) {
    console.error('Error checking script generation limit:', error);
    throw error;
  }
} 