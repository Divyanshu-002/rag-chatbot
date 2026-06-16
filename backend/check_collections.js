const mongoose = require('mongoose');
require('dotenv').config();

const listCollections = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections in astrologer-crm database:");
    collections.forEach(c => {
      console.log(` - ${c.name}`);
    });
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

listCollections();
