import mongoose from 'mongoose';

interface ICategory extends mongoose.Document {
    _id: string;
    name: string;
    description?: string;
    image: string;
    createdAt: Date;
    updatedAt: Date;
}

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        minlength: [2, "Category name must be at least 2 characters long"],
        maxlength: [50, "Category name cannot exceed 50 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [300, "Description cannot exceed 300 characters"]
    },
    image: {
        type: String,
        required: [true, "Image is required for the category"],
        trim: true
    }
}, { timestamps: true });

const CategoryModel = mongoose.model<ICategory>('category', categorySchema);

export { ICategory, CategoryModel };
