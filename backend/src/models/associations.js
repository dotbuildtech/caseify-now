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

CartItem.belongsTo(Product, { foreignKey: 'ProductId', constraints: false });
Product.hasMany(CartItem, { foreignKey: 'ProductId', constraints: false });

CartItem.belongsTo(ProductVariant, { foreignKey: 'ProductVariantId', as: 'variant', constraints: false });
ProductVariant.hasMany(CartItem, { foreignKey: 'ProductVariantId', constraints: false });

User.hasMany(Order, { foreignKey: 'UserId' });
Order.belongsTo(User, { foreignKey: 'UserId' });

Order.hasMany(OrderItem, { foreignKey: 'OrderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'OrderId' });

OrderItem.belongsTo(Product, { foreignKey: 'ProductId', constraints: false });
Product.hasMany(OrderItem, { foreignKey: 'ProductId', constraints: false });

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
const CategoryBrand = require('./CategoryBrand');
const Material = require('./Material');
const CategoryMaterial = require('./CategoryMaterial');
const Category = require('./Category');
const FilterOption = require('./FilterOption');
const CustomDesign = require('./CustomDesign');
const StudioBrand = require('./StudioBrand');
const StudioModel = require('./StudioModel');

Brand.hasMany(DeviceModel, { foreignKey: 'BrandId', as: 'models' });
Brand.hasOne(StudioBrand, { foreignKey: 'brandId', as: 'studioBrand' });
StudioBrand.belongsTo(Brand, { foreignKey: 'brandId' });

StudioBrand.hasMany(StudioModel, { foreignKey: 'studioBrandId', as: 'models' });
StudioModel.belongsTo(StudioBrand, { foreignKey: 'studioBrandId' });

const StudioProduct = require('./StudioProduct');
StudioProduct.belongsTo(StudioBrand, { foreignKey: 'studioBrandId' });
StudioProduct.belongsTo(StudioModel, { foreignKey: 'studioModelId' });
StudioProduct.belongsTo(Material, { foreignKey: 'materialId' });
StudioBrand.hasMany(StudioProduct, { foreignKey: 'studioBrandId', as: 'products' });
StudioModel.hasMany(StudioProduct, { foreignKey: 'studioModelId', as: 'products' });
Material.hasMany(StudioProduct, { foreignKey: 'materialId', as: 'products' });

const StudioTemplate = require('./StudioTemplate');
const EditableArea = require('./EditableArea');
const TemplateAsset = require('./TemplateAsset');

StudioProduct.hasOne(StudioTemplate, { foreignKey: 'studioProductId', as: 'template' });
StudioTemplate.belongsTo(StudioProduct, { foreignKey: 'studioProductId' });

StudioTemplate.hasMany(EditableArea, { foreignKey: 'studioTemplateId', as: 'editableAreas' });
EditableArea.belongsTo(StudioTemplate, { foreignKey: 'studioTemplateId' });

StudioTemplate.hasMany(TemplateAsset, { foreignKey: 'studioTemplateId', as: 'assets' });
TemplateAsset.belongsTo(StudioTemplate, { foreignKey: 'studioTemplateId' });

EditableArea.hasMany(TemplateAsset, { foreignKey: 'editableAreaId', as: 'assets' });
TemplateAsset.belongsTo(EditableArea, { foreignKey: 'editableAreaId' });
DeviceModel.belongsTo(Brand, { foreignKey: 'BrandId' });

Brand.hasMany(CategoryBrand, { foreignKey: 'BrandId', as: 'categoryBrands' });
CategoryBrand.belongsTo(Brand, { foreignKey: 'BrandId' });

Material.hasMany(CategoryMaterial, { foreignKey: 'MaterialId', as: 'categoryMaterials' });
CategoryMaterial.belongsTo(Material, { foreignKey: 'MaterialId' });

Product.belongsTo(Brand, { foreignKey: 'BrandId', constraints: false });
Product.belongsTo(DeviceModel, { foreignKey: 'DeviceModelId', constraints: false });

Category.hasMany(CategoryBrand, { foreignKey: 'categoryName', sourceKey: 'name', as: 'catBrandLinks' });
CategoryBrand.belongsTo(Category, { foreignKey: 'categoryName', targetKey: 'name', as: 'category' });

Category.hasMany(CategoryMaterial, { foreignKey: 'categoryName', sourceKey: 'name', as: 'catMaterialLinks' });
CategoryMaterial.belongsTo(Category, { foreignKey: 'categoryName', targetKey: 'name', as: 'category' });

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
    HeroSlide,
    CategoryBrand,
    Material,
    CategoryMaterial,
    Category,
    FilterOption,
    CustomDesign,
    StudioBrand,
    StudioModel,
    StudioProduct,
    StudioTemplate,
    EditableArea,
    TemplateAsset
};
