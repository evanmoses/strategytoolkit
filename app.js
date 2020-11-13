const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/stratToolDB', /* 'mongodb+srv://admin-evan:adminadmin@cluster0.foz6i.mongodb.net/todolistDB' */ { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });

app.get('/', (req, res) => {
  res.render('home');
});

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Server started on port 3000');
});
