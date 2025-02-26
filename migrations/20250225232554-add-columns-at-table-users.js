'use strict';

const tableName = 'Users';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(tableName, 'name', {
        type: Sequelize.STRING(100),
        allowNull: true,
      }),
      queryInterface.addColumn(tableName, 'phone', {
        type: Sequelize.STRING(50),
        allowNull: true,
      }),
      queryInterface.addColumn(tableName, 'address', {
        type: Sequelize.STRING(255),
        allowNull: true,
      }),
      queryInterface.addColumn(tableName, 'department', {
        type: Sequelize.STRING(100),
        allowNull: true,
      }),
    ]);
  },

  down: (queryInterface) => {
    return Promise.all([
      queryInterface.removeColumn(tableName, 'name'),
      queryInterface.removeColumn(tableName, 'phone'),
      queryInterface.removeColumn(tableName, 'address'),
      queryInterface.removeColumn(tableName, 'department'),
    ]);
  },
};
