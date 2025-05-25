import mongoose from 'mongoose';

interface IPayment extends mongoose.Document {
    _id: string;
    order: mongoose.Schema.Types.ObjectId;
    amount: number;
    currency: string;
    method: string;
    status: string;
    transactionID: string;  // Your internal or other gateway txn ID
    razorpayPaymentId?: string; // Razorpay Payment ID
    razorpayOrderId?: string;   // Razorpay Order ID
    receipt?: string;           // Razorpay Receipt ID (optional)
    createdAt: Date;
    updatedAt: Date;
    signature?: string; // ✨ Add this line
}

const paymentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: [true, "Order reference is required"]
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount cannot be negative"]
    },
    currency: {
        type: String,
        required: [true, "Currency is required"],
        enum: ['INR', 'USD'],
        default: "INR"
    },
    method: {
        type: String,
        required: [true, "Payment method is required"],
        enum: ['card', 'netbanking', 'upi', 'wallet', 'emi', 'bank_transfer', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        required: [true, "Payment status is required"],
        enum: ['created', 'authorized', 'captured', 'failed', 'refunded', 'cancelled'],
        default: 'created'
    },
    transactionID: {
        type: String,
        required: [true, "Transaction ID is required"],
        unique: true
    },
    razorpayPaymentId: {
        type: String
    },
    razorpayOrderId: {
        type: String,
        index: true,
    },
    signature: { // ✨ Add this field
        type: String
      },
    receipt: {
        type: String
    }
}, { timestamps: true });

const PaymentModel = mongoose.model<IPayment>('payment', paymentSchema);

export { IPayment, PaymentModel };
