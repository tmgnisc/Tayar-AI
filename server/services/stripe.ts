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
  const planConfig: Record<
    'pro' | 'enterprise',
    { amount: number; name: string; description: string }
  > = {
    pro: {
      amount: 29_00,
      name: 'Tayar.ai Pro Plan',
      description: 'Premium access with unlimited interviews',
    },
    enterprise: {
      amount: 40_00,
      name: 'Tayar.ai Enterprise Plan',
      description: 'Enterprise-grade access with team support',
    },
  };

  const plan = planConfig[planType];

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  console.log(`[Stripe] Creating checkout session with frontend URL: ${frontendUrl}`);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: plan.amount,
          product_data: {
            name: plan.name,
            description: plan.description,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/payment/cancel`,
    customer_email: userEmail,
    metadata: {
      userId: userId.toString(),
      planType: planType,
      amount: (plan.amount / 100).toString(),
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

