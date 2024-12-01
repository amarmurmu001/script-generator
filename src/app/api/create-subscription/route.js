import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    // Initialize Razorpay inside the function
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // First, fetch the plan details to get the amount
    const plan = await razorpay.plans.fetch(planId);
    
    if (!plan || !plan.item.amount) {
      throw new Error('Invalid plan or plan amount not found');
    }

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
      notes: {
        userId: userId
      }
    });

    if (!subscription || !subscription.id) {
      throw new Error('Failed to create subscription');
    }

    // Create payment link with the plan amount
    const paymentLink = await razorpay.paymentLink.create({
      amount: plan.item.amount,  // Amount from the plan
      currency: "INR",
      accept_partial: false,
      description: `Subscription to ${plan.item.name}`,
      customer: {
        notify: {
          email: true,
          sms: true
        }
      },
      reminder_enable: true,
      notes: {
        subscription_id: subscription.id,
        userId: userId,
        planId: planId
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?subscription_id=${subscription.id}`,
      callback_method: "get"
    });

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
      planName: plan.item.name
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