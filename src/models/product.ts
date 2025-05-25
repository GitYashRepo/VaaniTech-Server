import mongoose from 'mongoose';

interface IProduct extends mongoose.Document {
    _id: string;
    name: string;
    price: number;
    category: string;
    stock: number;
    description?: string;
    images: string[];
    video?: string;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [100, "Name cannot exceed 100 characters"]
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"]
    },
    category: {
        type: String,
        required: [true, "Category is required"],
        trim: true,
        minlength: [2, "Category must be at least 2 characters long"],
        maxlength: [50, "Category cannot exceed 50 characters"]
    },
    stock: {
        type: Number,
        required: [true, "Stock status is required"]
    },
    description: {
        type: String,
    },
    images: {
        type: [String],
        validate: {
            validator: function (v: string[]) {
                return v.length >= 1 && v.length <= 8;
            },
            message: "Product must have between 1 and 8 images"
        },
        required: [true, "At least 1 images are required"]
    },
    video: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const ProductModel = mongoose.model<IProduct>('product', productSchema);

export { IProduct, ProductModel };
