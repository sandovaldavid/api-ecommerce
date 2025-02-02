# 🛍️ E-Commerce REST API

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=Sequelize&logoColor=white)](https://sequelize.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

A robust REST API for e-commerce applications built with Node.js, Express, and MySQL. Features user authentication, product management, shopping cart functionality, and order processing.

## 📑 Table of Contents

- [🛍️ E-Commerce REST API](#️-e-commerce-rest-api)
  - [📑 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [🛠 Tech Stack](#-tech-stack)
  - [🚀 Installation](#-installation)
  - [⚙️ Environment Variables](#️-environment-variables)
  - [📘 API Documentation](#-api-documentation)
    - [Authentication](#authentication)
    - [Products](#products)
    - [Orders](#orders)
  - [🐳 Docker Deployment](#-docker-deployment)
  - [🤝 Contributing](#-contributing)
  - [🗺 Roadmap](#-roadmap)
  - [📄 License](#-license)

## ✨ Features

- User authentication and authorization
- Product and category management
- Shopping cart functionality
- Order processing and management
- Payment integration
- Review and rating system
- Role-based access control

## 🛠 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **ORM:** Sequelize
- **Authentication:** JWT
- **Containerization:** Docker

## 🚀 Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/sandovaldavid/api-ecommerce.git
   cd api-ecommerce
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   bun i
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

4. Start the MySQL database using Docker:

   ```bash
   docker-compose up -d
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

## ⚙️ Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DB_USER=developer
DB_PASS=123456
DB_NAME=ecommerce
DB_HOST=127.0.0.1
DB_PORT=3306
JWT_SECRET=your_jwt_secret
PORT=8080
```

## 📘 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get user orders |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order details |

## 🐳 Docker Deployment

Deploy the application using Docker:

```bash
# Build the Docker image
docker-compose build

# Start the services
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🗺 Roadmap

- [ ] Payment gateway integration
- [ ] Real-time order tracking
- [ ] Advanced search functionality
- [ ] Product recommendation system
- [ ] Multi-language support

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

📱 **Contact:** [David Sandoval](mailto:contact@devsandoval.me)  
🌐 **Demo:** [API Documentation](https://documenter.getpostman.com/view/38078864/2sAYX3r3mh)  
🔗 **GitHub:** [Repository](https://github.com/sandovaldavid/api-ecommerce.git)
