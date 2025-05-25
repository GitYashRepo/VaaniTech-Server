import mongoose from 'mongoose';

interface IOrder extends mongoose.Document {
    _id: string;
    user: mongoose.Types.ObjectId;
    products: mongoose.Types.ObjectId[];
    totalPrice: number;
    address: string;
    status: 'pending' | 'processed' | 'shipped' | 'delivered' | 'cancelled';
    payment?: mongoose.Types.ObjectId;
    delivery?: mongoose.Types.ObjectId;
    isPaid: boolean;
    paidAt?: Date;
    isDelivered: boolean;
    deliveredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User reference is required"]
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, "Product reference is required"]
        }
    ],
    totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
        min: [0, "Total price cannot be negative"]
    },
    address: {
        type: String,
        required: [true, "Delivery address is required"],
        trim: true,
        minlength: [5, "Address must be at least 5 characters long"],
        maxlength: [300, "Address cannot exceed 300 characters"]
    },
    status: {
        type: String,
        required: [true, "Order status is required"],
        enum: ['pending', 'processed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
    },
    delivery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    isDelivered: {
        type: Boolean,
        default: false
    },
    deliveredAt: {
        type: Date
    }
}, { timestamps: true });

const OrderModel = mongoose.model<IOrder>('order', orderSchema);

export { IOrder, OrderModel };
