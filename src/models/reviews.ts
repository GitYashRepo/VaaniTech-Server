import mongoose from 'mongoose';

interface IReview extends mongoose.Document {
    _id: string;
    user: mongoose.Types.ObjectId;
    product: mongoose.Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User reference is required"]
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, "Product reference is required"]
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: [1, "Rating must be at least 1"],
        max: [5, "Rating cannot be more than 5"]
    },
    comment: {
        type: String,
        trim: true,
        maxlength: [500, "Comment cannot exceed 500 characters"]
    }
}, { timestamps: true });

const ReviewModel = mongoose.model<IReview>('review', reviewSchema);

export { IReview, ReviewModel };
