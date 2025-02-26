'use strict';

const log = require(__base + 'lib/winston/logger');
const redisClient = require(__base + 'lib/redis/redis-async');
const ElasticSearch = require(__base + 'lib/elasticsearch/search');
const { ES_NUM_SHARDS, ES_NUM_REPLICAS, ES_INDEX_PREFIX } = process.env;

const index = `${ES_INDEX_PREFIX}-attendances`;
const indexInit = `${ES_INDEX_PREFIX}-attendances-000001`;
const modelName = 'Attendances';

class Attendances extends ElasticSearch {
  constructor(params = { index, indexInit, modelName }) {
    super(params.index);
    this.index = params.index;
    this.indexInit = params.indexInit;
    this.modelName = params.modelName;
    this.checkIndex();
  }

  async update(data) {
    try {
      const result = await super.update(data);

      if (result && result.success) {
        const redisKey = `${this.index}-${data.id}`;
        await redisClient.set(redisKey, JSON.stringify(data), 'EX', 1);
      }

      return result;
    } catch (err) {
      log.error(`[ESClient] failed update data on ${this.index}: ${JSON.stringify(err)}`);
      return { 
        success: false 
      };
    }
  }

  async sync(data) {
    try {
      const result = await super.sync(data);
      
      if (result && result.success) {
        const redisKey = `${this.index}-${data.id}`;
        await redisClient.set(redisKey, JSON.stringify(data), 'EX', 60);
      }

      return result;
    } catch (err) {
      log.error(`[ESClient] failed sync data on ${this.index}: ${JSON.stringify(err)}`);
      return { 
        success: false 
      };
    }
  }

  async checkIndex() {
    await this.createTemplate();
    const { body: exist } = await this.client.indices.exists({ index: this.index });
    if (!exist) {
      await this.createIndex();
    }
    await this.createMapping();
  }

  async createTemplate() {
    try {
      const { body: exist } = await this.client.indices.existsIndexTemplate({ name: this.index });
      
      if (!exist) {
        await this.client.indices.putIndexTemplate({
          name: this.index,
          create: true,
          body: {
            index_patterns: [`${this.index}-*`],
            template: {
                settings: {
                  number_of_shards: ES_NUM_SHARDS,
                  number_of_replicas: ES_NUM_REPLICAS,
                  analysis: {
                    normalizer: {
                      case_insensitive: {
                        type: 'custom',
                        filter: ['lowercase']
                      }
                    }
                  }
                },
                mappings: this.mappings()
            },
            priority: 500
          }
        });
        log.info(`[Elasticsearch] Created index template ${this.index}`);
      }
    } catch (error) {
      log.error(`[Elasticsearch] An error occurred while creating index template ${this.index}`, error);
    }
  }

  async createIndex() {
    try {
      await this.client.indices.create({
        index: this.indexInit,
        body: {
          aliases: { [this.index]: { is_write_index: true } }
        }
      });

      log.info(`[Elasticsearch] Created index ${this.indexInit}`);
    } catch (error) {
      log.error(`[Elasticsearch] An error occurred while creating the index ${this.indexInit}`, error);
    }
  }

  async createMapping() {
    try {
      await this.client.indices.putMapping({
        index: this.index,
        body: this.mappings()
      });
      log.info(`[Elasticsearch] Mapping updated ${this.index}`);
    } catch (error) {
      log.error(`[Elasticsearch] An error occurred while create index mapping ${this.index}`, error);
    }
  }

  mappings() {
    const textMap = { 
      type: 'text',
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256
        }
      }
    };

    return {
      properties: {
        id: { type: 'keyword' },
        userId: { type: 'keyword' },
        name: textMap,
        email: textMap,
        phone: textMap,
        department: textMap,
        notes: textMap,
        type: { type: 'keyword' },
        clockedAt: { type: 'date' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
      }
    };
  }

  get type() {
    return {
      CLOCK_IN: 'clock-in',
      CLOCK_OUT: 'clock-out',
    };
  }
}

module.exports = new Attendances();