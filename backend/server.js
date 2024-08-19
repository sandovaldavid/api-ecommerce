require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(express.json());

/*app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);*/

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
