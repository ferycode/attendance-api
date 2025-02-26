'use strict';

const fs = require('fs');
const path = require('path');
const log = require(__base + 'lib/winston/logger');
const basename = path.basename(module.filename);
const esClient = {};

// Read models from the models directory
fs.readdirSync(path.join(__dirname, 'models'))
  .filter(file => {
    return (file.indexOf('.') !== 0) && 
           (file !== basename) && 
           (file.slice(-3) === '.js');
  })
  .forEach(file => {
    try {
      log.info(`[Elasticsearch] Loading model: ${file}`);
      const model = require(path.join(__dirname, 'models', file));
      esClient[model.modelName] = model;
    } catch (error) {
      log.error(`[Elasticsearch] Error loading model ${file}:`, error);
    }
  });

module.exports = esClient;