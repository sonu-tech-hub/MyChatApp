const mongoose = require('mongoose');

// Use the MONGO_URI environment variable
const dbUri = process.env.MONGO_URI;

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
