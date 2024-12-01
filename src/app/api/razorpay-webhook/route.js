import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateSubscriptionStatus } from '@/lib/subscription';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('Webhook event:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.authenticated':
      case 'subscription.activated':
      case 'subscription.charged':
        const subscriptionEntity = event.payload.subscription.entity;
        const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionEntity.id);
        
        try {
          await subscriptionRef.update({
            status: 'active',
            currentPeriodEnd: new Date(subscriptionEntity.current_end * 1000).toISOString(),
            updatedAt: new Date().toISOString(),
            paymentStatus: 'paid'
          });
          console.log('Subscription updated successfully:', subscriptionEntity.id);
        } catch (error) {
          console.error('Error updating subscription:', error);
        }
        break;

      case 'payment.captured':
        const payment = event.payload.payment.entity;
        const subscription_id = payment.subscription_id;
        
        if (subscription_id) {
          try {
            const subscriptionDoc = await adminDb
              .collection('subscriptions')
              .doc(subscription_id)
              .get();

            if (subscriptionDoc.exists) {
              await subscriptionDoc.ref.update({
                status: 'active',
                paymentStatus: 'paid',
                lastPaymentId: payment.id,
                lastPaymentDate: new Date(payment.created_at * 1000).toISOString(),
                currentPeriodEnd: new Date(payment.created_at * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString()
              });
              console.log('Payment captured and subscription updated:', subscription_id);
            }
          } catch (error) {
            console.error('Error updating subscription after payment:', error);
          }
        }
        break;
    }

    return NextResponse.json({ 
      received: true,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 