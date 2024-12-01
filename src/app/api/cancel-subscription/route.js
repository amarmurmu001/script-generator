import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { subscriptionId } = await req.json();

    // Cancel subscription with Razorpay
    await razorpay.subscriptions.cancel(subscriptionId);

    // Update subscription status in Firestore
    await adminDb
      .collection('subscriptions')
      .doc(subscriptionId)
      .update({
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 