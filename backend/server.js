const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Product = require('./models/Product');
const User = require('./models/User');
const authRoutes = require('./routes/auth.routes');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// Function to generate SKU
const generateSKU = async (category) => {
    const timestamp = Date.now().toString().slice(-4);
    const categoryCode = category.slice(0, 3).toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const sku = `${categoryCode}-${timestamp}-${randomNum}`;

    const existingProduct = await Product.findOne({ sku });
    if (existingProduct) {

        return generateSKU(category);
    }
    
    return sku;
};

app.use('/api/auth', authRoutes);

// Product Routes (Protected)
app.post('/api/products', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, quantity, category } = req.body;
        
        // Validate required fields
        if (!name || price === undefined || quantity === undefined || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, price, quantity, and category'
            });
        }

        // Validate numeric fields
        if (isNaN(price) || isNaN(quantity)) {
            return res.status(400).json({
                success: false,
                message: 'Price and quantity must be valid numbers'
            });
        }

        // Validate positive numbers
        if (price < 0 || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price and quantity must be positive numbers'
            });
        }

        // Generate unique SKU
        const sku = await generateSKU(category);

        // Create new product instance
        const product = new Product({
            name,
            description: description || '',
            price: parseFloat(price),
            quantity: parseInt(quantity),
            category,
            sku,
            createdBy: req.user.userId
        });

        // Save the product
        const savedProduct = await product.save();
        
        // Send response
        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product: savedProduct
        });
    } catch (error) {
        console.error('Product creation error:', error);
        
        // Handle duplicate SKU error specifically
        if (error.code === 11000 && error.keyPattern?.sku) {
            return res.status(400).json({
                success: false,
                message: 'Error creating product. Please try again.',
                error: 'Duplicate SKU generated'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

app.get('/api/products', authenticateToken, async (req, res) => {
    try {
        const products = await Product.find({ createdBy: req.user.userId });
        res.json({ success: true, products });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching products' 
        });
    }
});

app.get('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid product ID format' 
            });
        }

        const product = await Product.findById(id)
            .populate('createdBy', 'username email -_id');
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({
            success: true,
            product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid product ID format' 
            });
        }

        const { name, description, price, quantity, category } = req.body;
        
        // Validate required fields
        if (!name || price === undefined || quantity === undefined || !category) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Validate numeric fields
        const numPrice = Number(price);
        const numQuantity = Number(quantity);

        if (isNaN(numPrice) || numPrice <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Price must be a positive number' 
            });
        }

        if (isNaN(numQuantity) || numQuantity < 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Quantity must be zero or greater' 
            });
        }

        // Find the product and verify ownership
        const product = await Product.findOne({ 
            _id: id, 
            createdBy: req.user.userId 
        });
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found or unauthorized' 
            });
        }

        // Update the product
        product.name = name.trim();
        product.description = description ? description.trim() : '';
        product.price = numPrice;
        product.quantity = numQuantity;
        product.category = category.trim();

        await product.save();

        res.json({ 
            success: true, 
            product 
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error updating product' 
        });
    }
});

// Delete product
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid product ID format' 
            });
        }

        // Find the product and verify ownership
        const product = await Product.findOne({ 
            _id: id, 
            createdBy: req.user.userId 
        });
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found or unauthorized' 
            });
        }

        await product.deleteOne();
        
        res.json({ 
            success: true, 
            message: 'Product deleted successfully' 
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error deleting product' 
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

// Database connection with cleanup
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        try {
            // Drop the products collection to start fresh
            await mongoose.connection.db.dropCollection('products')
                .then(() => console.log('Products collection dropped'))
                .catch(err => console.log('No products collection to drop'));

            console.log('Database cleanup completed');
        } catch (error) {
            console.error('Database cleanup error:', error);
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));
