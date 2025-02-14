const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/usersModels');
const bcrypt = require("bcrypt");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3100/auth/google/callback"
  },
  async function(accessToken, refreshToken, profile, done) {
    try {
       console.log('inside config passport google', accessToken, refreshToken, profile, done)
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (!user) {
        // Generate random password for Google users
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        // Create new user if doesn't exist
        user = await User.create({
          username: profile.displayName,
          email: profile.emails[0].value,
          mobile: '', // This will need to be collected later
          password: hashedPassword,
          is_blocked: 0,
          wallet: 0,
          wallet_history: [],
          wishlist: [],
          address: []
        });
      } else {
        // Update token for existing user
        user.token = accessToken;
        await user.save();
      }
      
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

exports.passport = passport