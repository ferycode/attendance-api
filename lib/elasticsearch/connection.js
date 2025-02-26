'use strict';

const { Client } = require('@elastic/elasticsearch');
const log = require(__base + 'lib/winston/logger');

class Connection {
  constructor(nodes, maxRetries, requestTimeout) {
    this.client = new Client({
      nodes: nodes || process.env.ES_NODES.toString().split(','),
      maxRetries: maxRetries || Number(process.env.ES_MAX_RETRY),
      requestTimeout: requestTimeout || Number(process.env.ES_TIMEOUT_SECS),
    });
  }

  async checkConnection() {
    try {
      await this.client.ping();
      log.info('Elasticsearch successfully connected');
      return true;
    } catch (error) {
      log.error('Elasticsearch connection error:', error);
      return false;
    }
  }
}

module.exports = Connection;