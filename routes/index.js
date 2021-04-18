const express = require('express');
const Tool = require('../models/tool.model.js');

const router = express.Router();

router.get('/', (req, res) => {
  Tool.find({}, (err, tools) => {
    if (!err) {
      res.render('home', {
        page_name: '',
        libs: ['../home-lib'],
        tools,
      });
    }
  });
});

module.exports = router;
