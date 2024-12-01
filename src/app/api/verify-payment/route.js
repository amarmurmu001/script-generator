import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { paymentId, subscriptionId } = await req.json();

    // Verify payment with Razorpay
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (payment.status === 'captured') {
      // Update subscription status in Firestore
      await adminDb
        .collection('subscriptions')
        .doc(subscriptionId)
        .update({
          status: 'active',
          paymentStatus: 'paid',
          lastPaymentId: paymentId,
          lastPaymentDate: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 