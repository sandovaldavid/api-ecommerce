import {faker} from '@faker-js/faker';
import {sequelize} from '../models/index.js';  // Importa tu instancia de Sequelize
import {Roles, User} from '../models/userRoles.js';
import {writeFile} from 'fs';
import path from 'path';
import Order from '../models/order.js';
import OrderDetails from '../models/orderDetails.js';
import Payment from '../models/payment.js';
import Product from '../models/product.js';
import Review from '../models/review.js';
import ShippingAddress from '../models/shippingAddress.js';
import Cart from '../models/cart.js';
import CartItems from '../models/cartItems.js';
import Category from '../models/category.js';

// Función para generar datos aleatorios y guardarlos en la base de datos
async function generateRandomData() {
  // Sincronizar la base de datos
  await sequelize.sync({alter: true});  // Esto reiniciará la base de datos (opcional)
  
  // Usar los roles predefinidos de roles.js
  const defaultRoles = [
    {id: faker.string.uuid(), name: 'admin'},
    {id: faker.string.uuid(), name: 'user'},
    {id: faker.string.uuid(), name: 'moderator'},
  ];
  
  // Crear roles predeterminados si no existen
  for (const role of defaultRoles) {
    const existingRole = await Roles.findOne({where: {name: role.name}});
    if (!existingRole) {
      await Roles.create(role);
    }
  }
  
  // Generar Categorías
  const categoriesData = [];
  for (let i = 0; i < 5; i++) {
    categoriesData.push({
      id: faker.string.uuid(),
      nombre: faker.commerce.department(),
      descripcion: faker.lorem.sentence(),
    });
  }
  await Category.bulkCreate(categoriesData);
  
  // Generar Productos
  const productsData = [];
  for (let i = 0; i < 10; i++) {
    productsData.push({
      id: faker.string.uuid(),
      nombre: faker.commerce.productName(),
      descripcion: faker.commerce.productDescription(),
      precio: faker.commerce.price(),
      stock: faker.number.int({min: 0, max: 100}),
      categoria_id: categoriesData[faker.number.int({min: 0, max: 4})].id,
    });
  }
  await Product.bulkCreate(productsData);

// Generar Usuarios y asignarles roles
  const usersCreated = []
  for (let i = 0; i < 10; i) {
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
    
    // Asignar roles al usuario
    const roles = await Roles.findAll()
    const randomRole_1 = roles[faker.number.int({min: 0, max: defaultRoles.length - 1})];
    const addSecondRole = faker.datatype.boolean();
    if (randomRole_1.name === 'user') {
    } else if (addSecondRole) {
      const randomRole_2 = roles[faker.number.int({min: 0, max: defaultRoles.length - 1})];
      if (randomRole_2.name === 'user') {
        continue;
      } else {
        await newUser.addRole(randomRole_2.id); // Asegúrate de usar solo el id del rol
        usersCreated.push({email: newUser.email, password: password, roles: [randomRole_1.name, randomRole_2.name]});
        i++;
        continue;
      }
    }
    await newUser.addRole(randomRole_1.id); // Asegúrate de usar solo el id del rol
    usersCreated.push({email: newUser.email, password: password, roles: randomRole_1.name});
    i++;
  }
  const allUsers = await User.findAll();
  
  // Generar Reviews
  
  const reviewsData = [];
  for (let i = 0; i < 10; i++) {
    reviewsData.push({
      id: faker.string.uuid(),
      rating: faker.number.int({min: 1, max: 5}),
      review_text: faker.lorem.sentence(),
      usuario_id: allUsers[faker.number.int({min: 0, max: 9})].id,
      producto_id: productsData[faker.number.int({min: 0, max: 9})].id,
    });
  }
  await Review.bulkCreate(reviewsData);
  
  // Generar Órdenes
  const ordersData = [];
  for (let i = 0; i < 10; i++) {
    ordersData.push({
      id: faker.string.uuid(),
      total: faker.commerce.price({min: 50, max: 500, dec: 2, symbol: '$'}),
      estado: 'pendiente',
      usuario_id: allUsers[faker.number.int({min: 0, max: 9})].id,
    });
  }
  await Order.bulkCreate(ordersData);
  
  // Generar Detalles de Orden
  const orderDetailsData = [];
  for (let i = 0; i < 10; i++) {
    orderDetailsData.push({
      id: faker.string.uuid(),
      cantidad: faker.number.int({min: 1, max: 10}),
      precio_unitario: faker.commerce.price({min: 10, max: 1000, dec: 2, symbol: '$'}),
      subtotal: faker.commerce.price({min: 10, max: 10000, dec: 2, symbol: '$'}),
      orden_id: ordersData[faker.number.int({min: 0, max: 9})].id,
      producto_id: productsData[faker.number.int({min: 0, max: 9})].id,
    });
  }
  await OrderDetails.bulkCreate(orderDetailsData);
  
  // Generar Pagos
  const paymentsData = [];
  for (let i = 0; i < 10; i++) {
    paymentsData.push({
      id: faker.string.uuid(),
      payment_date: faker.date.past(),
      payment_method: faker.finance.transactionType(),
      payment_status: faker.finance.transactionType(),
      amount: faker.commerce.price(),
      orden_id: ordersData[faker.number.int({min: 0, max: 9})].id,
    });
  }
  await Payment.bulkCreate(paymentsData);
  
  // Generar Direcciones de Envío
  const shippingAddressesData = [];
  for (let i = 0; i < 10; i++) {
    shippingAddressesData.push({
      id: faker.string.uuid(),
      address_line_1: faker.location.streetAddress(),
      address_line_2: faker.location.secondaryAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      postal_code: faker.location.zipCode(),
      usuario_id: allUsers[faker.number.int({min: 0, max: 9})].id,
    });
  }
  await ShippingAddress.bulkCreate(shippingAddressesData);
  
  // Generar Carritos
  const cartsData = [];
  for (let i = 0; i < 10; i++) {
    cartsData.push({
      id: faker.string.uuid(),
      usuario_id: allUsers[faker.number.int({min: 0, max: 9})].id,
    });
  }
  await Cart.bulkCreate(cartsData);
  
  // Generar Ítems de Carrito
  const cartItemsData = [];
  for (let i = 0; i < 10; i++) {
    cartItemsData.push({
      id: faker.string.uuid(),
      cantidad: faker.number.int({min: 1, max: 5}),
      cart_id: cartsData[faker.number.int({min: 0, max: 9})].id,
      producto_id: productsData[faker.number.int({min: 0, max: 9})].id,
    });
  }
  await CartItems.bulkCreate(cartItemsData);
  const jsonData = JSON.stringify(usersCreated, null, 2);
  const filePath = path.join(process.cwd(), "database", 'users_db.json');
  writeFile(filePath, jsonData, (err) => {
    if (err) {
      console.error('Error al escribir el archivo JSON:', err);
    } else {
      console.log('Archivo JSON creado con éxito.');
    }
  });
}

// Ejecutar la función para generar los datos aleatorios
generateRandomData().catch(error => {
  console.error('Error al generar datos aleatorios:', error);
});
