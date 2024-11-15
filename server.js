const express = require('express'); // استيراد مكتبة Express لإنشاء التطبيق
const mongoose = require('mongoose'); // استيراد مكتبة Mongoose للتفاعل مع قاعدة البيانات MongoDB
const jwt = require('jsonwebtoken'); // استيراد مكتبة jsonwebtoken للتعامل مع التوكنات JWT
const bodyParser = require('body-parser'); // استيراد مكتبة body-parser لتحليل جسم الطلب
const cors = require('cors'); // استيراد مكتبة cors لتمكين التواصل بين المواقع المختلفة

const app = express(); // إنشاء تطبيق Express
const port = 3000; // تحديد رقم المنفذ للاستماع

app.use(cors()); // تفعيل التواصل بين المواقع المختلفة باستخدام cors
app.use(express.json()); // تفعيل التعامل مع طلبات JSON
app.use(express.static('public')); // تمكين الوصول إلى الملفات الثابتة في المجلد public
app.use(bodyParser.json()); // تحليل جسم الطلب باستخدام body-parser

// اتصال MongoDB

mongoose.connect('mongodb://localhost/mydatabase', {  // استدعاء mongoose للتعامل مع MongoDB
    useNewUrlParser: true, // استخدم محلل العناوين  لـ MongoDB 
    useUnifiedTopology: true // استخدم آلية الكشف عن server  وتحسين إعادة الاتصال
}).then(() => {
    console.log('Connected to MongoDB mydatabase'); // في حال تم الاتصال بقاعدة البيانات بنجاح، اطبع هذه الرسالة
}).catch(err => {
    console.error('Error connecting to MongoDB', err); // في حال حدوث خطأ أثناء محاولة الاتصال، اطبع هذه الرسالة مع تفاصيل الخطأ
});

// تعريف مودل المستخدم باستخدام Mongoose
// تعريف مخطط (Schema) للمستخدمين في قاعدة البيانات MongoDB باستخدام Mongoose.
const UserSchema = new mongoose.Schema({
    username: String, // تعريف حقل الاسم المستخدم بأنه من نوع نصي (String)
    password: String  // تعريف حقل كلمة المرور بأنه من نوع نصي (String)
});


const ProductSchema = new mongoose.Schema({
    name: String,  
    price: Number  
});

const accountSchema = new mongoose.Schema({
    username: String,
    password: String  
});

// تعريف موديلات (نماذج) المستخدمين والمنتجات والحسابات باستخدام مخططات Mongoose
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Account = mongoose.model('Account', accountSchema);

// Middleware للتحقق من صحة JSON Web Token (JWT)
function authenticateToken(req, res, next) {
    // الحصول على الرمز المميز من رأس الطلب
    const authHeader = req.headers['authorization'];
    // فصل الرمز المميز عن "Bearer" إذا كان موجودًا
    const token = authHeader && authHeader.split(' ')[1];

    // إذا لم يتم توفير الرمز المميز، يتم إرجاع خطأ بأن العملية غير مصرح بها
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // التحقق من صحة الرمز المميز
    jwt.verify(token, 'secret-key', (err, user) => {
        // إذا فشل التحقق (مثل انتهاء صلاحية الرمز المميز)، يتم إرجاع خطأ بأن الوصول ممنوع
        if (err) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // إذا تم التحقق من الرمز المميز بنجاح، يتم تمرير البيانات إلى الطلب
        req.user = user;
        next(); // استمرار إلى الوسيط (middleware) أو المتحكم (controller) التالي
    });
}





// API لتسجيل الدخول وإصدار JWT
app.post('/api/login', cors(), async (req, res) => {
    // استخراج اسم المستخدم وكلمة المرور من الطلب
    const { username, password } = req.body;

    try {
        // التحقق من صحة اسم المستخدم وكلمة المرور
        const user = await User.findOne({ username, password });

        // إذا لم يتم العثور على المستخدم أو كانت كلمة المرور غير صحيحة، يتم إرجاع خطأ
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // إصدار الرمز المميز (JWT) للمستخدم المصادق
        const token = jwt.sign({ username }, 'secret-key');
        // طباعة الرمز المميز في سجل الخادم لأغراض التصحيح
        console.log(token);
        // إرجاع الرمز المميز للمستخدم
        return res.json({ token });
    } catch (error) {
        // في حالة وجود خطأ داخلي، يتم إرجاع رسالة خطأ
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});





// API لإنشاء مستخدم جديد
app.post('/api/users', (req, res) => {
    // استخراج اسم المستخدم وكلمة المرور من جسم الطلب
    const { username, password } = req.body;

    // إنشاء كائن مستخدم جديد باستخدام البيانات المقدمة
    const user = new User({ username, password });

    // حفظ المستخدم الجديد في قاعدة البيانات
    user.save()
        .then(() => {
            // إذا تم الحفظ بنجاح، أرسل رسالة نجاح إلى العميل
            return res.json({ message: 'User created successfully' });
        })
        .catch(error => {
            // إذا حدث خطأ أثناء الحفظ، أرسل رسالة خطأ إلى العميل
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        });
});

// API لإضافة حسابات
app.post('/api/accounts', authenticateToken, (req, res) => {
    // استخراج اسم المستخدم وكلمة المرور من جسم الطلب
    const {username ,  password} = req.body;

    // إنشاء كائن حساب جديد باستخدام البيانات المقدمة
    const account = new Account({ username , password });
    
    // حفظ الحساب الجديد في قاعدة البيانات
    account.save()
        .then(() => {
            // إذا تم الحفظ بنجاح، أرسل رسالة نجاح إلى العميل
            return res.json({ message: 'Account added successfully' });
        })
        .catch(error => {
            // إذا حدث خطأ أثناء الحفظ، أرسل رسالة خطأ إلى العميل
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        });
});


// API محمية يمكن الوصول إليها فقط بواسطة JWT صالح
app.get('/api/protected', authenticateToken, (req, res) => {
    // إذا تم التحقق من الرمز بنجاح، أرجع رسالة تأكيدية
    return res.json({ message: 'Protected API endpoint' });
});

// API لإضافة منتج جديد
app.post('/api/products', authenticateToken, (req, res) => {
    // استخراج اسم المنتج وسعره من جسم الطلب
    const { name, price } = req.body;

    // إنشاء كائن منتج جديد باستخدام البيانات المقدمة
    const product = new Product({ name, price });

    // حفظ المنتج الجديد في قاعدة البيانات
    product.save()
        .then(() => {
            // إذا تم الحفظ بنجاح، أرسل رسالة نجاح إلى العميل
            return res.json({ message: 'Product added successfully' });
        })
        .catch(error => {
            // إذا حدث خطأ أثناء الحفظ، أرسل رسالة خطأ إلى العميل
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        });
});

// API لجلب كل المنتجات
app.get('/api/products', authenticateToken, (req, res) => {
    // استخدام Mongoose لإيجاد جميع المنتجات في قاعدة البيانات
    Product.find()
        .then(products => {
            // إرجاع جميع المنتجات الموجودة
            return res.json(products);
        })
        .catch(error => {
            // إذا حدث خطأ، أرسل رسالة خطأ إلى العميل
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        });
});

// API لجلب منتج محدد بواسطة ID
app.get('/api/products/:id', authenticateToken, (req, res) => {
    // استخراج ID المنتج من معلمات الطلب
    const productId = req.params.id;

    // استخدام Mongoose لإيجاد المنتج بالID المحدد
    Product.findById(productId)
        .then(product => {
            if (!product) {
                // إذا لم يتم العثور على المنتج، أرسل رسالة خطأ
                return res.status(404).json({ error: 'Product not found' });
            }
            // إرجاع بيانات المنتج إذا تم العثور عليه
            return res.json(product);
        })
        .catch(error => {
            // إذا حدث خطأ، أرسل رسالة خطأ إلى العميل
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        });
});


// API لتحديث منتج بناءً على معرفه
app.put('/api/products/:id', authenticateToken, (req, res) => {
    // استخراج معرف المنتج من معلمات الطريق
    const productId = req.params.id;
    // استخراج بيانات الاسم والسعر من جسم الطلب
    const { name, price } = req.body;

    // تحديث المنتج في قاعدة البيانات باستخدام معرفه والبيانات الجديدة، مع إعادة المنتج المحدث
    Product.findByIdAndUpdate(productId, { name, price }, { new: true })
        .then(product => {
            if (!product) {
                // إذا لم يتم العثور على المنتج، أرجع خطأ
                return res.status(404).json({ error: 'Product not found' });
            }
            // إذا تم التحديث بنجاح، أرجع رسالة نجاح
            return res.json({ message: 'Product updatedddddddddddddd successfully' });
        })
        .catch(error => {
            // في حال حدوث خطأ أثناء التحديث، أرجع خطأ الخادم الداخلي
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        });
});

// API لحذف منتج بناءً على معرفه
app.delete('/api/products/:id', authenticateToken, (req, res) => {
    // استخراج معرف المنتج من معلمات الطريق
    const productId = req.params.id;

    // حذف المنتج من قاعدة البيانات باستخدام معرفه
    Product.findByIdAndDelete(productId)
        .then(product => {
            if (!product) {
                // إذا لم يتم العثور على المنتج، أرجع خطأ
                return res.status(404).json({ error: 'Product not found' });
            }
            // إذا تم الحذف بنجاح، أرجع رسالة نجاح
            return res.json({ message: 'Product deleted successfully' });
        })
        .catch(error => {
            // في حال حدوث خطأ أثناء الحذف، أرجع خطأ الخادم الداخلي
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        });
});

// بدء تشغيل الخادم
app.listen(port, () => {
    // طباعة رسالة في وحدة التحكم تفيد بأن الخادم يعمل وعلى أي ميناء
    console.log(`Server is running on port ${port}`);
});
