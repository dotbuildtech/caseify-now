const { sequelize } = require('../config/db');

const User = require('./User');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const Inventory = require('./Inventory');
const { Cart, CartItem } = require('./Cart');
const { Order, OrderItem } = require('./Order');
const Invoice = require('./Invoice');
const Design = require('./Design');
const Campaign = require('./Campaign');
const RefreshToken = require('./RefreshToken');
const Supplier = require('./Supplier');
const Expense = require('./Expense');
const PaymentRecord = require('./PaymentRecord');

Product.hasMany(ProductVariant, { foreignKey: 'ProductId', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'ProductId' });

Product.hasOne(Inventory, { foreignKey: 'ProductId' });
Inventory.belongsTo(Product, { foreignKey: 'ProductId' });

User.hasOne(Cart, { foreignKey: 'UserId' });
Cart.belongsTo(User, { foreignKey: 'UserId' });

Cart.hasMany(CartItem, { foreignKey: 'CartId', as: 'items' });
CartItem.belongsTo(Cart, { foreignKey: 'CartId' });

CartItem.belongsTo(Product, { foreignKey: 'ProductId' });
Product.hasMany(CartItem, { foreignKey: 'ProductId' });

CartItem.belongsTo(ProductVariant, { foreignKey: 'ProductVariantId', as: 'variant' });
ProductVariant.hasMany(CartItem, { foreignKey: 'ProductVariantId' });

User.hasMany(Order, { foreignKey: 'UserId' });
Order.belongsTo(User, { foreignKey: 'UserId' });

Order.hasMany(OrderItem, { foreignKey: 'OrderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'OrderId' });

OrderItem.belongsTo(Product, { foreignKey: 'ProductId' });
Product.hasMany(OrderItem, { foreignKey: 'ProductId' });

Order.hasOne(Invoice, { foreignKey: 'OrderId' });
Invoice.belongsTo(Order, { foreignKey: 'OrderId' });

User.hasMany(Invoice, { foreignKey: 'UserId' });
Invoice.belongsTo(User, { foreignKey: 'UserId' });

User.hasOne(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Design, { foreignKey: 'UserId' });
Design.belongsTo(User, { foreignKey: 'UserId' });

Product.hasMany(Design, { foreignKey: 'ProductId' });
Design.belongsTo(Product, { foreignKey: 'ProductId' });

Supplier.hasMany(Expense, { foreignKey: 'SupplierId', as: 'expenses' });
Expense.belongsTo(Supplier, { foreignKey: 'SupplierId', as: 'supplier' });

User.hasMany(PaymentRecord, { foreignKey: 'UserId' });
PaymentRecord.belongsTo(User, { foreignKey: 'UserId' });

Order.hasOne(PaymentRecord, { foreignKey: 'OrderId', as: 'paymentRecord' });
PaymentRecord.belongsTo(Order, { foreignKey: 'OrderId' });

const MaterialDesign = require('./MaterialDesign');
const Brand = require('./Brand');
const DeviceModel = require('./DeviceModel');
const HeroSlide = require('./HeroSlide');

Brand.hasMany(DeviceModel, { foreignKey: 'BrandId', as: 'models' });
DeviceModel.belongsTo(Brand, { foreignKey: 'BrandId' });

Product.belongsTo(Brand, { foreignKey: 'BrandId', constraints: false });
Product.belongsTo(DeviceModel, { foreignKey: 'DeviceModelId', constraints: false });

module.exports = {
    sequelize,
    User,
    Product,
    ProductVariant,
    Inventory,
    Cart,
    CartItem,
    Order,
    OrderItem,
    Invoice,
    Design,
    Campaign,
    RefreshToken,
    Supplier,
    Expense,
    PaymentRecord,
    MaterialDesign,
    Brand,
    DeviceModel,
    HeroSlide
};
