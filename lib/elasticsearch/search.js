'use strict';
/* eslint no-console: 0 */

const Connection = require('./connection');
const log = require(__base + 'lib/winston/logger');
const { get, has, isArray, isNumber, isObject, isEmpty, last, omit } = require('lodash');

class ElasticSearch extends Connection {
  constructor(index) {
    super();
    this.index = index;
  }

  async search(data) {
    try {
      Object.assign(data, {
        size: data.size || 10000
      });
  
      Object.assign(data.body, {
        sort: data.body.sort || []
      });
  
      Object.assign(data, { index: this.index });
  
      const { body } = await this.client.search(data);
      const hits = get(body, 'hits.hits');
  
      return hits.map(value => {
        const _ = {
          index: value._index,
          type: value._type,
          id: value._id,
          score: value._score,
          sort: value.sort,
        };

        if (data.seq_no_primary_term) {
          return Object.assign({ _ }, {
            seqNo: value._seq_no,
            primaryTerm: value._primary_term,
            source: value._source
          });
        }
        return Object.assign({ _ }, value._source);
      });
    } catch (err) {
      log.error(`[ESClient] search error on ${this.index}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async aggregation({ where, aggs, order, opts = {} }) {
    try {
      const options = {
        track_total_hits: false,
        index: this.index,
        size: 0,
      };

      const body = { ...opts };
      if (isObject(where) && !isEmpty(where)) {
        body.query = where;
      }
      if (isObject(aggs) && !isEmpty(aggs)) {
        body.aggs = aggs;
      }
      if ((isArray(order) || isObject(order)) && !isEmpty(order)) {
        body.sort = order;
      }

      log.info(`[ESClient] body: ${JSON.stringify(body)}`);
  
      const { body: res } = await this.client.search(Object.assign({ body }, options));

      return get(res, 'aggregations') || {};
    } catch (err) {
      log.error(`[ESClient] aggregations error on ${this.index}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async aggregationAll({ where, sources = [], limit = 10000, order, opts = {} }) {
    try {
      const results = [];
      const aggs = {
        aggs: { 
          composite: { 
            size: limit,
            sources, 
           },
          ...opts
        },
      };

      const _getAggs = async (aggs) => {
        const aggregations = await this.aggregation({ where, aggs, limit, order });
        const buckets = get(aggregations, 'aggs.buckets');
        const after = get(aggregations, 'aggs.after_key');

        results.push(...buckets);

        if (after) {
          Object.assign(aggs, {
            aggs: {
              composite: { 
                size: limit, 
                sources, 
                after 
              }
            }
          });
          await _getAggs(aggs);
        }
      };

      await _getAggs(aggs);
      return results;
    } catch (err) {
      log.error(`[ESClient] aggsAll error on ${this.index}: ${JSON.stringify(err)}`);
      return [];
    }
  }

  async sync(data) {
    try {
      Object.assign(data, { index: this.index });

      const { body } = await this.client.index(data);
      
      log.info(`[ESClient] synced data on ${this.index}: ${JSON.stringify(data)}`);
      log.info(`[ESClient] successfully synced data on ${this.index}: ${JSON.stringify(body)}`);

      return { 
        success: body._shards && body._shards.successful > 0 
      };
    } catch (err) {
      log.error(`[ESClient] failed sync data on ${this.index}: ${JSON.stringify(err)}`);
      throw err;
    }
  }
  
  async count(data) {
    try {
      Object.assign(data, { index: this.index });

      const { body } = await this.client.count(data);
      
      return body.count || 0;
    } catch (err) {
      log.error(`[ESClient] count error on ${this.index}: ${JSON.stringify(err)}`);
      return 0;
    }
  }

  async bulk(data) {
    try {
      const { body } = await this.client.bulk(data);
      
      log.info(`[ESClient] successfully bulk saved data on ${this.index}`);

      return { 
        success: !body.errors, 
        count: body.items.length 
      };
    } catch (err) {
      log.error(`[ESClient] failed bulk save data on ${this.index}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async create(data) {
    try {
      Object.assign(data, { index: this.index });
      const { body } = await this.client.create(data);

      log.info(`[ESClient] successfully saved data on ${this.index}: ${JSON.stringify(body)}`);

      return { 
        success: body._shards && body._shards.successful > 0 
      };
    } catch (err) {
      log.error(`[ESClient] failed save data on ${this.index}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async update(data) {
    try {
      const options = data.options || {};

      const { body } = await this.client.update({
        id: data.id,
        index: this.index,
        body: { doc: data.body },
        retry_on_conflict: 10,
        ...options
      });

      log.info(`[ESClient] update data on ${this.index}: ${JSON.stringify(data.body)}`);
      log.info(`[ESClient] successfully update data on ${this.index}: ${JSON.stringify(body)}`);

      return { 
        success: body._shards && body._shards.successful > 0 
      };
    } catch (err) {
      log.error(`[ESClient] failed update data on ${this.index}: ${JSON.stringify(err)}`);

      let retryCount = data.retryCount || 0;
      retryCount++;

      // set flag isConflict = true
      if (err.meta && err.meta.statusCode === 409 && has(data, 'body.id')) {
        await this.setConflict(data, retryCount);
        return { success: false };
      }
      throw err;
    }
  }

  async setConflict(data, retryCount = 0) {
    try {
      const maxRetry = 5;
      const delay = Math.pow(2, retryCount) * 100; // delay with exponential backoff

      if (retryCount > maxRetry) {
        log.error(`[ESClient] set conflict data exceeds max retry on ${this.index} with id : ${data.id}`);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      
      const exist = await this.get({ id: data.id });

      if (exist && exist.found) {
        const existData = get(exist, '_source');
        const params = Object.assign(existData, {
          isConflict: true
        });

        log.info(`[ESClient] set conflict data on ${this.index} with id : ${data.id}`);

        await this.update({ id: data.id, body: params, retryCount });
      }
      return;
    } catch (err) {
      log.error(`[ESClient] failed set conflict data on ${this.index}: ${JSON.stringify(err)}`);
      return;
    }
  }

  async get(data) {
    try {
      Object.assign(data, { index: this.index });
      const { body } = await this.client.get(data, { ignore: [404] });
      return body;
    } catch (err) {
      log.error(`[ESClient] get data error on ${this.index}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async delete(data) {
    try {
      Object.assign(data, { index: this.index });
      const { body } = await this.client.delete(data);

      log.info(`[ESClient] successfully delete data on ${this.index}`);
      
      return { 
        success: body._shards && body._shards.successful > 0 
      };
    } catch (err) {
      log.error(`[ESClient] get data error on ${this.index}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async findByPk(id) {
    try {
      const data = await this.get({ id });
      return get(data, '_source');
    } catch (err) {
      log.error(`[ESClient] findByPk error on ${this.index}: ${JSON.stringify(err)}`);
      return null;
    }
  }

  async findOne({ where, order, attributes }) {
    try {
      const result = await this._getAll({ limit: 1, attributes, where, order });
      return get(result, '0');
    } catch (err) {
      log.error(`[ESClient] findOne error on ${this.index}: ${JSON.stringify(err)}`);
      return null;
    }
  }

  async _getAll({ where, order, offset, limit, attributes, unlimited = false }, options = {}) {
    try {
      let body = {};

      if ((isObject(where) || isArray(where)) && !isEmpty(where)) {
        Object.assign(body, {
          query: where
        });
      }

      if (isArray(attributes) && !isEmpty(attributes)) {
        Object.assign(options, {
          _source: attributes
        });
      }
      
      if (isArray(order) && !isEmpty(order)) {
        Object.assign(body, {
          sort: order
        });
      }

      if (isNumber(limit)) {
        Object.assign(options, {
          size: limit
        });
      }

      if (isNumber(offset)) {
        Object.assign(options, {
          from: offset
        });
      }

      if (unlimited) {
        let results = [];
        const count = await this.count({ 
          body: omit(body, 'sort')
        });
        
        for (let i = 0; i < Math.ceil(count / 10000); i++) {
          if (isArray(results) && !isEmpty(results)) {
            const searchAfter = get(last(results), ['_', 'sort']);
  
            if (isArray(searchAfter) && !isEmpty(searchAfter)) {
              Object.assign(body, {
                search_after: searchAfter
              });
            }
          }
          
          const data = await this.search({ body, ...options });
          results = results.concat(data);
        }
        
        return results;
      }

      const data = await this.search({ body, ...options });

      return data;
    } catch (err) {
      log.error(`[ESClient] getAll error on ${this.index}: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  async findAll({ where, order, offset, limit, attributes, unlimited = false }, options = {}) {
    try {
      const data = await this._getAll({ where, order, offset, limit, attributes, unlimited }, options);

      return data;
    } catch (err) {
      log.error(`[ESClient] findAll error on ${this.index}: ${JSON.stringify(err)}`);
      return [];
    }
  }

  async findAndCountAll({ where, order, offset, limit, attributes, unlimited = false }, options = {}) {
    try {
      let body = {};

      if ((isObject(where) || isArray(where)) && !isEmpty(where)) {
        Object.assign(body, {
          query: where
        });
      }

      const [count, rows] = await Promise.all([
        this.count({ body }),
        this._getAll({ where, order, offset, limit, attributes, unlimited }, options)
      ]);

      return { count, rows };
    } catch (err) {
      log.error(`[ESClient] findAndCountAll error on ${this.index}: ${JSON.stringify(err)}`);

      return {
        count: 0, 
        rows: []
      };
    }
  }
}

module.exports = ElasticSearch;