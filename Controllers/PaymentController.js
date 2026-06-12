import Stripe from 'stripe';

// @desc    Get Stripe Payment Config
// @route   GET /payments/config
// @access  Public
export const getPaymentConfig = (req, res) => {
    res.json({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
};

// @desc    Create Payment Intent
// @route   POST /payments/create-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
    try {
        const { amount, orderTrackingNumber } = req.body;

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({ message: 'Stripe is not configured on the server.' });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Convert amount to cents (Stripe expects lowest currency unit, e.g., paisa for PKR, but here it's assumed standard decimal so if it's PKR, PKR is a zero-decimal currency, wait, PKR has paisas but usually handled as whole. Stripe requires PKR in whole amount but generally API takes smallest unit. Let's multiply by 100 to be safe if Stripe expects it. Wait, PKR is a 2-decimal currency in Stripe. So multiply by 100)
        // Let's multiply by 100.
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'pkr',
            metadata: {
                orderId: orderTrackingNumber,
            },
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        res.status(500).json({ message: error.message });
    }
};
