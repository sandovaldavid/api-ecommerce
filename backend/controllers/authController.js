const User = require('../models/user');
const jwt = require('jsonwebtoken');
const uid2 = require('uid2');

exports.register = async (req, res) => {
  try {
    const {nombre, email, password} = req.body;
    const user = await User.create({nombre, email, hashed_password: password});
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
    res.status(201).json({token});
  } catch (error) {
    res.status(400).json({error: error.message});
  }
};

exports.login = async (req, res) => {
  try {
    const {email, password} = req.body;
    const user = await User.findOne({where: {email}});
    if (!user || !(await user.checkPassword(password))) {
      return res.status(401).json({error: 'Invalid email or password'});
    }
    const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
    res.status(200).json({token});
  } catch (error) {
    res.status(400).json({error: error.message});
  }
};
