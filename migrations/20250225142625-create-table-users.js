'use strict';

const tableName = 'Users';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.createTable(tableName, {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        email: {
          allowNull: false,
          type: Sequelize.STRING(50),
          unique: true
        },
        password: {
          allowNull: true,
          type: Sequelize.STRING(255)
        },
        token: {
          allowNull: true,
          type: Sequelize.TEXT
        },
        isLocked: {
          allowNull: false,
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        createdAt: {
          allowNull: false,
          type: 'TIMESTAMP',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          allowNull: false,
          type: 'TIMESTAMP',
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        },
        deletedAt: {
          allowNull: true,
          type: 'TIMESTAMP'
        }
      }, { transaction });

      await Promise.all([
        queryInterface.addIndex(tableName, ['email'], { transaction }),
        queryInterface.addIndex(tableName, ['isLocked'], { transaction }),
      ]);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.dropTable(tableName, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
