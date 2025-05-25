import mongoose from 'mongoose';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface IAdmin extends mongoose.Document {
    _id: string;
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'superadmin';
    createdAt: Date;
    updatedAt: Date;
}

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long"],
        maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [5, "Email must be at least 5 characters long"],
        maxlength: [100, "Email cannot exceed 100 characters"],
        match: [emailRegex, "Invalid email format"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
        maxlength: [100, "Password cannot exceed 100 characters"]
    },
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: ['admin', 'superadmin'],
        default: 'admin'
    }
}, { timestamps: true });

const AdminModel = mongoose.model<IAdmin>('admin', adminSchema);

export { IAdmin, AdminModel };
