require('dotenv').config();
const mongoose = require('mongoose');

const fixIndexes = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to DB');

    const db = mongoose.connection.db;
    const collection = db.collection('invoices');

    console.log('🔍 Checking existing indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    // Look for the problematic index on 'invoiceNumber' (usually named 'invoiceNumber_1')
    const badIndex = indexes.find(i => i.key.invoiceNumber === 1 && Object.keys(i.key).length === 1);
    
    if (badIndex) {
      console.log(`⚠️ Found bad global index: ${badIndex.name}. Dropping it...`);
      await collection.dropIndex(badIndex.name);
      console.log('✅ Bad index dropped successfully.');
    } else {
      console.log('ℹ️ No global unique index found on invoiceNumber (this is good).');
    }

    // Explicitly create the new compound index just in case
    // Though Mongoose usually handles this on startup if the schema is updated
    console.log('🛠 Ensuring correct compound index { user: 1, invoiceNumber: 1 }...');
    await collection.createIndex({ user: 1, invoiceNumber: 1 }, { unique: true });
    console.log('✅ Compound index verified/created.');

    console.log('🎉 DB Fix Complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
