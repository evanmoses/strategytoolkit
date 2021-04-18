const indexRouter = require('./routes/index');
const aboutRouter = require('./routes/about');
const toolRouter = require('./routes/tool');
const addToolRouter = require('./routes/addtool');
const editToolRouter = require('./routes/edittool');

const base = process.env.BASE_URL;

module.exports = function (app) {
  app.use(`${base}/`, indexRouter);
  app.use(`${base}/about`, aboutRouter);
  app.use(`${base}/tool`, toolRouter);
  app.use(`${base}/addtool`, addToolRouter);
  app.use(`${base}/edittool`, editToolRouter);
};
