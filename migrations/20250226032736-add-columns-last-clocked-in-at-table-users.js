'use strict';

const tableName = 'Users';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(tableName, 'lastClockedIn', {
      type: 'TIMESTAMP',
      allowNull: true,
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(tableName, 'lastClockedIn');
  },
};
