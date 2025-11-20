import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

// Create a checkout session for premium subscription
export async function createCheckoutSession(
  userId: number,
  userEmail: string,
  planType: 'pro' | 'enterprise' = 'pro'
): Promise<Stripe.Checkout.Session> {
  // Define price IDs - these should be created in Stripe Dashboard
  // For test mode, create a product and price in Stripe Dashboard and use the test price ID
  const priceIds: Record<string, string> = {
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
  };

  const priceId = priceIds[planType];

  if (!priceId) {
    throw new Error(
      `STRIPE_${planType.toUpperCase()}_PRICE_ID is not set. ` +
      `Please create a product and price in Stripe Dashboard and add the price ID to your .env file.`
    );
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
    customer_email: userEmail,
    metadata: {
      userId: userId.toString(),
      planType: planType,
    },
    subscription_data: {
      metadata: {
        userId: userId.toString(),
        planType: planType,
      },
    },
  });

  return session;
}

// Retrieve checkout session
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    return null;
  }
}

// Handle successful payment and update subscription
export async function handleSuccessfulPayment(
  session: Stripe.Checkout.Session,
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = parseInt(session.metadata?.userId || '0');
  const planType = (session.metadata?.planType || 'pro') as 'pro' | 'enterprise';

  if (!userId) {
    throw new Error('User ID not found in session metadata');
  }

  // This will be called from the webhook handler
  // The webhook handler will update the database
  console.log(`✅ Payment successful for user ${userId}, plan: ${planType}`);
}

