import Stripe from 'stripe';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const stripeService = {
  /**
   * Create a checkout session for a specific price and workspace
   */
  async createCheckoutSession(workspaceId, priceId, successUrl, cancelUrl) {
    try {
      // Get workspace details to check for existing customer_id
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('customer_id, name')
        .eq('id', workspaceId)
        .single();

      if (error) throw error;

      const sessionConfig = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          workspaceId: workspaceId,
        },
      };

      // Use existing customer_id if available
      if (workspace.customer_id) {
        sessionConfig.customer = workspace.customer_id;
      }

      const session = await stripe.checkout.sessions.create(sessionConfig);
      return session;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  /**
   * Create a customer portal session for subscription management
   */
  async createPortalSession(workspaceId, returnUrl) {
    try {
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .select('customer_id')
        .eq('id', workspaceId)
        .single();

      if (error || !workspace.customer_id) {
        throw new Error('Workspace does not have a linked Stripe customer');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: workspace.customer_id,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  },

  /**
   * Handle Stripe Webhooks
   */
  async handleWebhook(signature, rawBody) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      throw new Error(`Webhook Error: ${err.message}`);
    }

    const { workspaceId } = event.data.object.metadata || {};

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        // Optional: Send receipt, etc.
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionChange(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return event;
  },

  async handleCheckoutSessionCompleted(session) {
    const { workspaceId } = session.metadata;
    const customerId = session.customer;
    const subscriptionId = session.subscription;

    // Retrieve subscription details to find the plan type
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0].price.id;
    
    // Map Price ID to Plan Level
    // Price IDs: Starter=price_1TI0b9Q3SP0nKpKnfjRTvwwE, Pro=price_1TI0bCQ3SP0nKpKnBulfOYKA
    let plan = 'free';
    if (priceId === 'price_1TI0b9Q3SP0nKpKnfjRTvwwE') plan = 'starter';
    if (priceId === 'price_1TI0bCQ3SP0nKpKnBulfOYKA') plan = 'pro';

    await supabase
      .from('workspaces')
      .update({
        plan: plan,
        subscription_status: 'active',
        customer_id: customerId,
        subscription_id: subscriptionId,
      })
      .eq('id', workspaceId);
  },

  async handleSubscriptionChange(subscription) {
    const customerId = subscription.customer;
    const status = subscription.status === 'active' ? 'active' : 'inactive';
    
    const priceId = subscription.items.data[0].price.id;
    let plan = 'free';
    if (status === 'active') {
      if (priceId === 'price_1TI0b9Q3SP0nKpKnfjRTvwwE') plan = 'starter';
      if (priceId === 'price_1TI0bCQ3SP0nKpKnBulfOYKA') plan = 'pro';
    }

    await supabase
      .from('workspaces')
      .update({
        plan: plan,
        subscription_status: status,
      })
      .eq('customer_id', customerId);
  }
};
