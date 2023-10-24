const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);

router.get('/', async (req, res) => {
  const users = await User.find();
  res.render('index', { users });
});

router.post('/', 
  body('name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
      });

      await newUser.save();
      res.redirect('/users');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error interno del servidor');
    }
  }
);

router.get('/edit/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.render('partials/edit', { user });
});

router.post('/update/:id', async (req, res) => {
  try {
      const user = await User.findById(req.params.id);
      if (req.body.password) {
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

          await User.findByIdAndUpdate(req.params.id, { 
              name: req.body.name, 
              email: req.body.email, 
              password: hashedPassword 
          });
      } else {
          await User.findByIdAndUpdate(req.params.id, { 
              name: req.body.name, 
              email: req.body.email, 
              password: user.password 
          });
      }

      res.redirect('/users');
  } catch (error) {
      console.error(error);
      res.status(500).send('Error interno del servidor');
  }
});


router.get('/delete/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/users');
});

module.exports = router;