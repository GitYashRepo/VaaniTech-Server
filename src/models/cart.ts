import mongoose from 'mongoose';

interface ICartProduct {
    product: mongoose.Types.ObjectId;
    quantity: number;
}

interface ICart extends mongoose.Document {
    _id: string;
    user: mongoose.Types.ObjectId;
    products: ICartProduct[];
    totalPrice: number;
    couponCode?: string;
    discount?: number;
    isCheckedOut: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User reference is required"]
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: [true, "Product reference is required"]
            },
            quantity: {
                type: Number,
                required: [true, "Quantity is required"],
                default: 1,
                min: [1, "Quantity cannot be less than 1"]
            }
        }
    ],
    totalPrice: {
        type: Number,
        required: [true, "Total price is required"],
        min: [0, "Total price cannot be negative"]
    },
    couponCode: {
        type: String
    },
    discount: {
        type: Number,
        min: [0, "Discount cannot be negative"],
        default: 0
    },
    isCheckedOut: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const CartModel = mongoose.model<ICart>('cart', cartSchema);

export { ICart, CartModel };
