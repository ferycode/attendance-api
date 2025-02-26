'use strict';

module.exports = function (sequelize, DataTypes) {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING(50),
        unique: true
      },
      name: {
        allowNull: true,
        type: DataTypes.STRING(50),
      },
      phone: {
        allowNull: true,
        type: DataTypes.STRING(50),
      },
      address: {
        allowNull: true,
        type: DataTypes.STRING(255),
      },
      department: {
        allowNull: true,
        type: DataTypes.STRING(100),
      },
      password: {
        allowNull: true,
        type: DataTypes.STRING(255)
      },
      token: {
        allowNull: true,
        type: DataTypes.TEXT
      },
      isLocked: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      lastClockedIn: {
        allowNull: true,
        type: 'TIMESTAMP',
      },
      createdAt: {
        allowNull: false,
        type: 'TIMESTAMP',
      },
      updatedAt: {
        allowNull: false,
        type: 'TIMESTAMP',
      },
      deletedAt: {
        allowNull: true,
        type: 'TIMESTAMP'
      }
    },
    {
      tableName: 'Users',
      paranoid: true
    }
  );

  User.DEPARTMENT = {
    IT: 'IT',
    HR: 'HR',
    FINANCE: 'FINANCE',
    MARKETING: 'MARKETING',
    SALES: 'SALES',
    OTHER: 'OTHER'
  }
  
  return User;
};
