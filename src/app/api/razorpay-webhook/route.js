import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateSubscriptionStatus } from '@/lib/subscription';

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
        await updateSubscriptionStatus(
          subscriptionEntity.id,
          'active',
          new Date(subscriptionEntity.current_end * 1000).toISOString()
        );
        break;

      case 'subscription.cancelled':
        await updateSubscriptionStatus(
          event.payload.subscription.entity.id,
          'cancelled',
          null
        );
        break;

      case 'payment.captured':
        // Handle successful payment
        const subscription_id = event.payload.payment.entity.subscription_id;
        if (subscription_id) {
          await updateSubscriptionStatus(
            subscription_id,
            'active',
            new Date(event.payload.payment.entity.created_at * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString()
          );
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