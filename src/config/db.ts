import mongoose from 'mongoose';

const connectToDb = () => {
    if (!process.env.DB_CONNECT) {
        throw new Error('MONGOURL environment variable is not defined');
    }

    mongoose.connect(process.env.DB_CONNECT)
        .then(() => {
            console.log('Connected to DB');
        }).catch(err => console.log(err));
}

export { connectToDb };
