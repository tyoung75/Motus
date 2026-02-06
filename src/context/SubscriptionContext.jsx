import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  loadSubscription,
  saveSubscription,
  loadReferrals,
  createReferral,
  completeReferral
} from '../lib/database';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if paywall should be bypassed (dev mode or Tyler's friend)
  const bypassPaywall =
    localStorage.getItem('motus_bypass_paywall') === 'true' ||
    localStorage.getItem('motus_tylers_friend') === 'true' ||
    import.meta.env.DEV === true;

  // Determine if user has active subscription
  const isSubscribed = useCallback(() => {
    if (bypassPaywall) return true;
    if (!subscription) return false;

    const now = new Date();
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;

    // Active paid subscription
    if (subscription.status === 'active' && subscription.subscription_type === 'paid') {
      return !periodEnd || now < periodEnd;
    }

    // Referral subscription (first month only)
    if (subscription.status === 'referral' || subscription.status === 'active') {
      return periodEnd && now < periodEnd;
    }

    return false;
  }, [subscription, bypassPaywall]);

  // Load subscription data on auth change
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated || !user) {
        setSubscription(null);
        setReferrals([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: subData } = await loadSubscription();
        setSubscription(subData);

        const { data: refData } = await loadReferrals();
        setReferrals(refData || []);
      } catch (error) {
        console.error('Error loading subscription:', error);
      }
      setLoading(false);
    };

    loadData();
  }, [isAuthenticated, user]);

  // Initialize subscription for new user (creates trial with referral code)
  const initializeSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) return null;

    // Check if already has subscription
    const { data: existing } = await loadSubscription();
    if (existing) {
      setSubscription(existing);
      return existing;
    }

    // Create new trial subscription
    const newSub = {
      status: 'trial',
      subscription_type: null,
      referral_count: 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await saveSubscription(newSub);
    if (!error && data) {
      setSubscription(data);
      return data;
    }
    return null;
  }, [isAuthenticated, user]);

  // Activate subscription after Stripe payment
  const activatePaidSubscription = useCallback(async (stripeData) => {
    const updatedSub = {
      ...subscription,
      status: 'active',
      subscription_type: 'paid',
      stripe_customer_id: stripeData.customerId,
      stripe_subscription_id: stripeData.subscriptionId,
      current_period_start: new Date().toISOString(),
      current_period_end: stripeData.currentPeriodEnd,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await saveSubscription(updatedSub);
    if (!error && data) {
      setSubscription(data);
      return data;
    }
    return null;
  }, [subscription]);

  // Process a referral completion (when referred friend signs up)
  const processReferralCompletion = useCallback(async (referralCode, refereeId) => {
    const { data, error } = await completeReferral(referralCode, refereeId);
    if (!error) {
      // Reload subscription to get updated referral count
      const { data: subData } = await loadSubscription();
      setSubscription(subData);

      const { data: refData } = await loadReferrals();
      setReferrals(refData || []);
    }
    return { data, error };
  }, []);

  // Get referral count
  const referralCount = subscription?.referral_count || 0;
  const referralCode = subscription?.referral_code || null;
  const referralsNeeded = Math.max(0, 3 - referralCount);

  // Check if referral period is active and not expired
  const isReferralActive = useCallback(() => {
    if (!subscription) return false;
    if (subscription.subscription_type !== 'referral') return false;

    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;

    return periodEnd && new Date() < periodEnd;
  }, [subscription]);

  // Tyler's friend bypass
  const activateTylersFriend = useCallback(() => {
    localStorage.setItem('motus_tylers_friend', 'true');
    // Force re-render
    window.location.reload();
  }, []);

  const value = {
    subscription,
    referrals,
    loading,
    isSubscribed: isSubscribed(),
    bypassPaywall,
    referralCount,
    referralCode,
    referralsNeeded,
    isReferralActive: isReferralActive(),
    initializeSubscription,
    activatePaidSubscription,
    processReferralCompletion,
    activateTylersFriend
  };

  return (
    <SubscriptionContext.Provider value={value}>
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

export default SubscriptionContext;
