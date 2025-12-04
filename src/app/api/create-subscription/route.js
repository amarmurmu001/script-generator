import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // TODO: Implement subscription creation without Razorpay
    const subscription = {
      id: `sub_${Date.now()}`,
      status: 'created'
    };
    
    const plan = {
      item: {
        amount: 0,
        name: 'Free Plan'
      }
    };

    // TODO: Create payment link without Razorpay
    const paymentLink = {
      id: `link_${Date.now()}`,
      short_url: '#'
    };

    // Store subscription details using Firebase Admin
    const subscriptionData = {
      userId,
      subscriptionId: subscription.id,
      planId,
      status: subscription.status,
      createdAt: new Date().toISOString(),
      currentPeriodEnd: null,
      paymentLinkId: paymentLink.id,
      shortUrl: paymentLink.short_url,
      amount: plan.item.amount,
      planName: plan.item.name,
      scriptLimit: {
        total: plan.item.name.toLowerCase().includes('pro') ? 200 : 
               plan.item.name.toLowerCase().includes('starter') ? 50 : 5,
        remaining: plan.item.name.toLowerCase().includes('pro') ? 200 : 
                  plan.item.name.toLowerCase().includes('starter') ? 50 : 5,
        limitType: plan.item.name.toLowerCase().includes('free') ? 'total' : 'daily',
        lastReset: new Date().toISOString()
      }
    };

    await adminDb
      .collection('subscriptions')
      .doc(subscription.id)
      .set(subscriptionData);

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      shortUrl: paymentLink.short_url 
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create subscription' 
    }, { status: 500 });
  }
} 