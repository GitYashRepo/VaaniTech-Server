import mongoose from 'mongoose';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface IUser extends mongoose.Document {
    _id: string;
    name: string;
    email: string;
    password?: string;
    phone?: number;
    addresses?: Array<any>;
}

const AddressSchema = new mongoose.Schema({
    state: {
        type: String,
        required: [true, "State is required"],
        minlength: [2, "State must be at least 2 characters long"]
    },
    zip: {
        type: Number,
        required: [true, "ZIP code is required"],
        min: [10000, "ZIP code must be at least 5 digits"],
        max: [999999, "ZIP code must be at max 6 digits only"]
    },
    city: {
        type: String,
        required: [true, "City is required"],
        minlength: [2, "City must be at least 2 characters long"]
    },
    address: {
        type: String,
        required: [true, "Address is required"],
        minlength: [5, "Address must be at least 5 characters long"]
    },
})

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, "Name is required"],
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [40, "Name cannot exceed 40 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [emailRegex, "Please provide a valid email address"]
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters long"]
    },
    phone: {
        type: Number,
        validate: {
            validator: (v: string) => /^(\d{10})$/.test(v),
            message: "Phone number must be a 10-digit number"
        },
    },
    addresses: {
        type: [AddressSchema],
    },
},{timestamps: true}
);

const userModel = mongoose.model<IUser>("user", userSchema);

export { IUser, userModel };
