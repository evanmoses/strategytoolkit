const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();

const app = express();

const publicDir = (path.join(__dirname, 'public'));
if (process.env.BASE_URL === '') {
  app.use('/', express.static(publicDir));
} else {
  app.use(process.env.BASE_URL, express.static(publicDir));
}

require('./router')(app);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'));

// eslint-disable-next-line prefer-const
let mongoosePort = process.env.CLOUD_DB;
// mongoosePort = process.env.LOCAL_DB;
mongoose.connect(mongoosePort, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});

let port = process.env.PORT;
// port = ''
if (port == null || port === '') {
  port = 5000;
}

app.listen(port, () => {
  console.log(`server started successfully on port ${port}`);
});
