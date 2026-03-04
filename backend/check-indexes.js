require('dotenv').config();
const mongoose = require('mongoose');

const checkIndexes = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    const collection = mongoose.connection.db.collection('invoices');
    const indexes = await collection.indexes();
    console.log('📊 Current Indexes:');
    indexes.forEach(idx => console.log(` - ${idx.name}: ${JSON.stringify(idx.key)}`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkIndexes();
