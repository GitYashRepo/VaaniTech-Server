import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { userModel } from "../models/user";
import { Profile } from 'passport-google-oauth20';

// Type checking for environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = 'http://localhost:3000/v1/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials are not defined in environment variables');
}

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: CALLBACK_URL
        },
        async function(accessToken: string, refreshToken: string, profile: Profile, cb: any) {
            try {
                if (!profile.emails || profile.emails.length === 0) {
                    return cb(new Error('No email found in Google profile'), false);
                }

                const email = profile.emails[0].value;
                let user = await userModel.findOne({ email });
                if (!user) {
                    user = new userModel({
                        name: profile.displayName,
                        email,
                        googleId: profile.id
                    });
                    await user.save();
                }
                return cb(null, user);
            } catch (error) {
                return cb(error, false);
            }
        }
    )
);

passport.serializeUser((user: any, cb: (err: any, id?: any) => void) => {
    return cb(null, user._id);
});

passport.deserializeUser(async function(id: string, cb: (err: any, user?: any) => void) {
    let user = await userModel.findOne({ _id: id });
    cb(null, user);
});

export {passport};
