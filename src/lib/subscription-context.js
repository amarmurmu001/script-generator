'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { getUserSubscription } from './subscription';
import { checkScriptGenerationLimit } from './script-limits';

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscriptionData, setSubscriptionData] = useState({
    subscription: null,
    limits: null,
  });

  const updateSubscriptionData = useCallback(async (userId) => {
    if (!userId) return;
    
    const [subscription, limits] = await Promise.all([
      getUserSubscription(userId, true),
      checkScriptGenerationLimit(userId)
    ]);

    setSubscriptionData({
      subscription,
      limits
    });
  }, []);

  return (
    <SubscriptionContext.Provider value={{ 
      ...subscriptionData, 
      updateSubscriptionData 
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
} 