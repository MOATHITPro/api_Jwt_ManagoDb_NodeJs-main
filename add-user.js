const { MongoClient } = require('mongodb');

// تكوين اتصال MongoDB
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function addData() {
    try {
        // الاتصال بخادم MongoDB
        await client.connect();
        console.log('Connected to MongoDB');

        // اختيار قاعدة البيانات والمجموعة
        const database = client.db('mydatabase');
        const collection = database.collection('users');

        // إنشاء مستخدم جديد
        const newUser = {
            username: 'sali',
            password: 'sali'
        };

        // إدخال المستخدم إلى المجموعة
        const result = await collection.insertOne(newUser);
        console.log('User ' + newUser.username +' saved successfully');
        console.log();

        // إغلاق اتصال MongoDB بعد الانتهاء
        await client.close();
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
}

// استدعاء الدالة لإضافة البيانات
addData();