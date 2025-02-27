'use strict';

global.__base = global.__base || __dirname + '/';
const envoodoo = require('envoodoo');

envoodoo(e => {
  if (e) throw e;
  const express = require('express');
  const db = require('./app/models');
  const ElasticClient = require('./lib/elasticsearch/search');
  const log = require('./lib/winston/logger');
  const requestLogger = require('./lib/middleware/request-logger');
  const queueProcessor = require('./lib/redis/queue-processor');

  const app = express();
  const cors = require('cors');
  const passport = require('passport');
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(cors());
  app.use(passport.initialize());
  app.use(requestLogger);

  // Initialize JWT & Google OAuth
  require('./lib/jwt/config')(passport);
  require('./lib/oauth/google')(passport);

  // Initialize database connection
  async function initConnections() {
    try {
      // MySQL
      await db.sequelize.authenticate();
      log.info('MySQL successfully connected');

      // Elasticsearch
      const esClient = new ElasticClient();
      await esClient.checkConnection();
    } catch (error) {
      log.error('Unable to connect to the databases:', error);
    }
  }

  initConnections();

  // API Routes
  require('./app/controllers')(app);

  app.get('/', (req, res) => {
    res.json({ 
      message: 'Attendance API',
      version: '1.0.0',
      author: 'Fery Dedi Supardi',
    });
  });

  app.listen(PORT, () => {
    log.info(`Server is running on port ${PORT}`);
    queueProcessor(); // Initialize queue processor
  });
});
