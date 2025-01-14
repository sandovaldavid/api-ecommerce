import { faker } from "@faker-js/faker";
import { sequelize } from "../models/index.js";
import { Roles, User } from "../models/userRoles.js";
import { writeFile } from "fs";
import path from "path";
import Order from "../models/order.js";
import OrderDetails from "../models/orderDetails.js";
import Payment from "../models/payment.js";
import Product from "../models/product.js";
import Review from "../models/review.js";
import ShippingAddress from "../models/shippingAddress.js";
import Cart from "../models/cart.js";
import CartItems from "../models/cartItems.js";
import Category from "../models/category.js";

const usersToPrint = [];
async function generateRandomData () {
    await sequelize.sync({ alter: true });
  
    const defaultRoles = [
        { id: faker.string.uuid(), name: "admin" },
        { id: faker.string.uuid(), name: "user" },
        { id: faker.string.uuid(), name: "moderator" },
    ];
  
    for (const role of defaultRoles) {
        const existingRole = await Roles.findOne({ where: { name: role.name } });
        if (!existingRole) {
            await Roles.create(role);
        }
    }
  
    const categoriesData = [];
    const usedNames = new Set();

    for (let i = 0; i < 15; i++) {
        let name;
        do {
            name = faker.commerce.department();
        } while (usedNames.has(name));

        usedNames.add(name);
        categoriesData.push({
            id: faker.string.uuid(),
            name,
            description: faker.lorem.sentence(),
        });
    }
    await Category.bulkCreate(categoriesData);
  
    const productsData = [];
    const usedProductNames = new Set();

    for (let i = 0; i < 100; i++) {
        let productName;
        do {
            productName = faker.commerce.productName();
        } while (usedProductNames.has(productName));

        usedProductNames.add(productName);
        productsData.push({
            id: faker.string.uuid(),
            name: productName,
            url_img: "https://placehold.co/400x300",
            description: faker.commerce.productDescription(),
            price: faker.commerce.price({ min: 10, max: 1000, dec: 2, symbol: "" }),
            stock: faker.number.int({ min: 0, max: 100 }),
            categoryId: categoriesData[faker.number.int({ min: 0, max: categoriesData.length - 1 })].id,
        });
    }

    await Product.bulkCreate(productsData);
  
    const usersCreated = [];
    for (let i = 0; i < 25; i) {
        const password = faker.internet.password();
        const newUser = await User.create({
            id: faker.string.uuid(),
            firstName: faker.person.firstName(),
            secondName: faker.person.firstName(),
            lastName_father: faker.person.lastName(),
            lastName_mother: faker.person.lastName(),
            email: faker.internet.email(),
            hashed_password: password,
        });
    
        const roles = await Roles.findAll();
        const randomRole1 = roles[faker.number.int({ min: 0, max: defaultRoles.length - 1 })];
        await newUser.addRole(randomRole1.id);
        const addSecondRole = faker.datatype.boolean();
        if (addSecondRole) {
            const randomRole2 = roles[faker.number.int({ min: 0, max: defaultRoles.length - 1 })];
            if (randomRole2.name === "user") {
                continue;
            } else {
                await newUser.addRole(randomRole2.id);
                usersToPrint.push({ email: newUser.email, password, roles: [randomRole1.name, randomRole2.name] });
                usersCreated.push({ email: newUser.email, password, roles: [randomRole1.name, randomRole2.name] });
                i++;
                continue;
            }
        }
        usersToPrint.push({ email: newUser.email, password, roles: [randomRole1.name] });
        usersCreated.push({ email: newUser.email, password, roles: randomRole1.name });
        i++;
    }
    const allUsers = await User.findAll();
  
    const reviewsData = [];
    for (let i = 0; i < 500; i++) {
        reviewsData.push({
            id: faker.string.uuid(),
            rating: faker.number.int({ min: 1, max: 5 }),
            review_text: faker.lorem.sentence(),
            userId: allUsers[faker.number.int({ min: 0, max: 24 })].id,
            productId: productsData[faker.number.int({ min: 0, max: 99 })].id,
        });
    }
    await Review.bulkCreate(reviewsData);
  
    const ordersData = [];
    for (let i = 0; i < 500; i++) {
        ordersData.push({
            id: faker.string.uuid(),
            total: faker.commerce.price({ min: 50, max: 500, dec: 2, symbol: "" }),
            state: "pending",
            userId: allUsers[faker.number.int({ min: 0, max: 24 })].id,
        });
    }
    await Order.bulkCreate(ordersData);
  
    const orderDetailsData = [];
    for (let i = 0; i < 800; i++) {
        orderDetailsData.push({
            id: faker.string.uuid(),
            quantity: faker.number.int({ min: 1, max: 10 }),
            unitPrice: faker.commerce.price({ min: 10, max: 1000, dec: 2, symbol: "" }),
            subtotal: faker.commerce.price({ min: 10, max: 10000, dec: 2, symbol: "" }),
            orderId: ordersData[faker.number.int({ min: 0, max: 499 })].id,
            productId: productsData[faker.number.int({ min: 0, max: 99 })].id,
        });
    }
    await OrderDetails.bulkCreate(orderDetailsData);
  
    const paymentsData = [];
    for (let i = 0; i < 10; i++) {
        paymentsData.push({
            id: faker.string.uuid(),
            payment_date: faker.date.past(),
            payment_method: faker.helpers.arrayElement(["creditCard", "paypal"]),
            payment_status: faker.helpers.arrayElement(["paid", "pending"]),
            amount: faker.commerce.price({ min: 50, max: 500, dec: 2, symbol: "" }),
            orderId: ordersData[faker.number.int({ min: 0, max: 499 })].id,
        });
    }
    await Payment.bulkCreate(paymentsData);
  
    const shippingAddressesData = [];
    for (let i = 0; i < 25; i++) {
        shippingAddressesData.push({
            id: faker.string.uuid(),
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            stateProvince: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country(),
            userId: allUsers[i].id,
        });
    }
    await ShippingAddress.bulkCreate(shippingAddressesData);
  
    const cartsData = [];
    for (let i = 0; i < 100; i++) {
        cartsData.push({
            id: faker.string.uuid(),
            userId: allUsers[faker.number.int({ min: 0, max: 24 })].id,
        });
    }
    await Cart.bulkCreate(cartsData);
  
    const cartItemsData = [];
    for (let i = 0; i < 300; i++) {
        cartItemsData.push({
            id: faker.string.uuid(),
            quantity: faker.number.int({ min: 1, max: 30 }),
            cartId: cartsData[faker.number.int({ min: 0, max: 99 })].id,
            productId: productsData[faker.number.int({ min: 0, max: 99 })].id,
        });
    }
    await CartItems.bulkCreate(cartItemsData);

    const jsonData = JSON.stringify(usersCreated, null, 2);
    const filePath = path.join(process.cwd(), "database", "users_db.json");
    writeFile(filePath, jsonData, (err) => {
        if (err) {
            console.error("Error al escribir el archivo JSON:", err);
        } else {
            console.log("Archivo JSON creado con éxito.");
        }
    });
}

generateRandomData().catch(error => {
    console.error("Error al generar datos aleatorios:", error);
});