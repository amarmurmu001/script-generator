import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { subscriptionId, userId } = await req.json();

    if (!subscriptionId || !userId) {
      throw new Error('Subscription ID and User ID are required');
    }

    // Get subscription from Firestore first
    const subscriptionDoc = await adminDb.collection('subscriptions').doc(subscriptionId).get();
    if (!subscriptionDoc.exists) {
      throw new Error('Subscription not found');
    }

    const subscriptionData = subscriptionDoc.data();
    const razorpaySubId = subscriptionData.razorpaySubscriptionId;

    if (razorpaySubId) {
      try {
        // Cancel subscription with Razorpay
        await razorpay.subscriptions.cancel(razorpaySubId);
      } catch (razorpayError) {
        console.error('Razorpay cancellation error:', razorpayError);
        // Continue with Firestore update even if Razorpay fails
      }
    }

    // Update subscription status in Firestore
    const batch = adminDb.batch();

    // Update the subscription document
    const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
    batch.update(subscriptionRef, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      planName: 'Free',
      planDetails: {
        name: 'Free',
        limit: 5,
        limitType: 'total'
      }
    });

    // Update or create user's subscription document
    const userSubscriptionRef = adminDb.collection('subscriptions').doc(userId);
    batch.set(userSubscriptionRef, {
      userId: userId,
      status: 'cancelled',
      planName: 'Free',
      planDetails: {
        name: 'Free',
        limit: 5,
        limitType: 'total'
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Commit the batch
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to cancel subscription' 
    }, { status: 500 });
  }
} 