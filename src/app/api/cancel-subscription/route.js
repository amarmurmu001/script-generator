import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { cancelSubscription } from '@/lib/subscription';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    const { subscriptionId } = await req.json();

    // Cancel subscription in Razorpay
    await razorpay.subscriptions.cancel(subscriptionId);

    // Update subscription status in Firestore
    await cancelSubscription(subscriptionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 