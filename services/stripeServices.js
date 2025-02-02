import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (amount, currency = "usd") => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
        });
        return paymentIntent;
    } catch (error) {
        throw new Error(`Error creating payment intent: ${error.message}`);
    }
};

export const confirmPayment = async (paymentIntentId) => {
    try {
        return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
        throw new Error(`Error confirming payment: ${error.message}`);
    }
};