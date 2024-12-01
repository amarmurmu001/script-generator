import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { planId, userId } = await req.json();

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 12, // Number of billing cycles (12 for yearly)
    });

    // Store subscription details in Firestore
    const subscriptionData = {
      userId,
      subscriptionId: subscription.id,
      planId,
      status: subscription.status,
      createdAt: new Date().toISOString(),
      currentPeriodEnd: null, // Will be updated when payment is successful
    };

    await addSubscriptionToFirestore(subscriptionData);

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url 
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 