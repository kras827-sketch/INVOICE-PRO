require('dotenv').config();
const mongoose = require('mongoose');
const Invoice = require('./models/Invoice');
// Mock User model if needed, or just use IDs
const mockUserId1 = new mongoose.Types.ObjectId();
const mockUserId2 = new mongoose.Types.ObjectId();

const testInvoiceGen = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Cleanup previous test data
    await Invoice.deleteMany({ user: { $in: [mockUserId1, mockUserId2] } });

    console.log('🧪 Test 1: Generate first invoice for User 1');
    const invNum1 = await Invoice.generateInvoiceNumber(mockUserId1);
    console.log(`User 1 Invoice #1: ${invNum1}`);
    
    const invoice1 = new Invoice({
      user: mockUserId1,
      invoiceNumber: invNum1,
      items: [{ name: 'Test Item', quantity: 1, price: 100 }],
      company: { name: 'Test Co' },
      client: { name: 'Test Client' }
    });
    await invoice1.save();
    console.log('✅ Invoice 1 saved');

    console.log('🧪 Test 2: Generate second invoice for User 1 (Should increment)');
    const invNum2 = await Invoice.generateInvoiceNumber(mockUserId1);
    console.log(`User 1 Invoice #2: ${invNum2}`);
    
    if (invNum2 === invNum1) throw new Error('Invoice number did not increment!');
    
    const invoice2 = new Invoice({
      user: mockUserId1,
      invoiceNumber: invNum2,
      items: [{ name: 'Test Item', quantity: 1, price: 100 }],
      company: { name: 'Test Co' },
      client: { name: 'Test Client' }
    });
    await invoice2.save();
    console.log('✅ Invoice 2 saved');

    console.log('🧪 Test 3: Generate invoice for User 2 (Should not conflict)');
    const invNum3 = await Invoice.generateInvoiceNumber(mockUserId2);
    console.log(`User 2 Invoice #1: ${invNum3}`);
    
    // It's okay if it starts at 1 again, or whatever the logic is. 
    // The key is that it saves without error even if it's the SAME number as User 1
    const invoice3 = new Invoice({
      user: mockUserId2,
      invoiceNumber: invNum3,
      items: [{ name: 'Test Item', quantity: 1, price: 100 }],
      company: { name: 'Test Co' },
      client: { name: 'Test Client' }
    });
    await invoice3.save();
    console.log('✅ Invoice 3 saved (User 2)');

    console.log('🎉 All uniqueness tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  }
};

testInvoiceGen();
