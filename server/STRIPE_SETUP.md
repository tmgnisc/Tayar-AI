# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payments for premium subscriptions.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Stripe API keys (available in Stripe Dashboard)

## Environment Variables

Add the following environment variables to your `.env` file (either in the project root or `server/.env`):

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...     # Your Stripe secret key (test mode)
STRIPE_WEBHOOK_SECRET=whsec_...   # Webhook signing secret (get from Stripe Dashboard)

# Frontend URL (for redirects after payment)
FRONTEND_URL=http://localhost:5173  # Change to your production URL
```

> ✅ **No products or price IDs required.**  
> The backend now uses dynamic prices for $29 (Pro) and $40 (Enterprise).

## Webhook Setup

1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - For local development, use [ngrok](https://ngrok.com) or [Stripe CLI](https://stripe.com/docs/stripe-cli)
4. Subscribe to the `checkout.session.completed` event
5. Copy the **Signing secret** (starts with `whsec_`) and set `STRIPE_WEBHOOK_SECRET`

### Step 3: Test Mode

For testing, use Stripe's test mode:
- Test API keys start with `sk_test_` and `pk_test_`
- Use test card numbers from [Stripe Testing](https://stripe.com/docs/testing)
- Example test card: `4242 4242 4242 4242` (any future expiry date, any CVC)

## Testing the Integration

1. Start your server: `npm run server`
2. Start your frontend: `npm run dev`
3. Sign in to your account
4. Go to the Pricing page
5. Click "Start Pro Trial" on the Pro plan
6. You'll be redirected to Stripe Checkout
7. Use a test card: `4242 4242 4242 4242`
8. Complete the payment
9. You should be redirected back to the success page

## Webhook Testing (Local Development)

For local development, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI
# Then run:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook signing secret that you can use for local testing.

## Production Setup

1. Switch to live mode in Stripe Dashboard
2. Update environment variables with live keys:
   - `STRIPE_SECRET_KEY` → use `sk_live_...`
   - `STRIPE_WEBHOOK_SECRET` → use production webhook secret
3. Update `FRONTEND_URL` to your production domain
4. Set up production webhook endpoint in Stripe Dashboard

## Troubleshooting

### Payment succeeds but subscription not activated
- Check webhook logs in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check server logs for webhook errors

### "Failed to create checkout session"
- Ensure `STRIPE_SECRET_KEY` is set
- Confirm the backend was restarted after updating `.env`
- Check Stripe Dashboard logs for additional error details

### Webhook signature verification fails
- Ensure webhook endpoint uses raw body (already configured)
- Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret
- Check that webhook URL is accessible

## Database Schema

The integration uses the following database fields:
- `users.subscription_type`: 'free', 'pro', or 'enterprise'
- `users.subscription_status`: 'active', 'cancelled', or 'expired'
- `users.subscription_start_date`: Start date of subscription
- `users.subscription_end_date`: End date of subscription
- `subscriptions` table: Records all subscription transactions

## Support

For issues or questions:
1. Check Stripe Dashboard logs
2. Review server logs
3. Verify environment variables are set correctly
4. Test with Stripe test mode first

