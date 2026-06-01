const { Cart, CartItem } = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ 
            where: { UserId: req.user.id },
            include: [{ model: CartItem, include: [Product] }]
        });
        
        if (!cart) {
            cart = await Cart.create({ UserId: req.user.id });
        }
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addItemToCart = async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        let cart = await Cart.findOne({ where: { UserId: req.user.id } });

        if (!cart) {
            cart = await Cart.create({ UserId: req.user.id });
        }

        let cartItem = await CartItem.findOne({ 
            where: { CartId: cart.id, ProductId: productId } 
        });

        if (cartItem) {
            cartItem.quantity += parseInt(quantity);
            await cartItem.save();
        } else {
            await CartItem.create({ 
                CartId: cart.id, 
                ProductId: productId, 
                quantity: quantity 
            });
        }

        const updatedCart = await Cart.findOne({
            where: { id: cart.id },
            include: [{ model: CartItem, include: [Product] }]
        });

        res.json(updatedCart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
exports.removeItemFromCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ where: { UserId: req.user.id } });

        if (cart) {
            await CartItem.destroy({
                where: { CartId: cart.id, ProductId: req.params.productId }
            });
            
            const updatedCart = await Cart.findOne({
                where: { id: cart.id },
                include: [{ model: CartItem, include: [Product] }]
            });
            res.json(updatedCart);
        } else {
            res.status(404).json({ message: 'Cart not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
