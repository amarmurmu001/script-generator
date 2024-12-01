import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { adminDb } from '@/lib/firebase-admin';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12,
      notes: {
        userId: userId,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      },
      notify: {
        sms: true,
        email: true,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
    });

    if (!subscription || !subscription.short_url) {
      throw new Error('Failed to create subscription');
    }

    // Store subscription details using Firebase Admin
    const subscriptionData = {
      userId,
      subscriptionId: subscription.id,
      planId,
      status: subscription.status,
      createdAt: new Date().toISOString(),
      currentPeriodEnd: null,
    };

    await adminDb
      .collection('subscriptions')
      .doc(subscription.id)
      .set(subscriptionData);

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url 
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to create subscription' 
    }, { status: 500 });
  }
} 