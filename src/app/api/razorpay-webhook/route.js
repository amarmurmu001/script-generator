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

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.activated':
        await updateSubscriptionStatus(
          event.payload.subscription.entity.id,
          'active',
          new Date(event.payload.subscription.entity.current_end * 1000).toISOString()
        );
        break;

      case 'subscription.cancelled':
        await updateSubscriptionStatus(
          event.payload.subscription.entity.id,
          'cancelled',
          null
        );
        break;

      case 'subscription.charged':
        // Handle successful payment
        await updateSubscriptionStatus(
          event.payload.subscription.entity.id,
          'active',
          new Date(event.payload.subscription.entity.current_end * 1000).toISOString()
        );
        break;

      // Add more cases as needed
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 