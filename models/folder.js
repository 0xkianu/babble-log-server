'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Folder extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Folder.init({
    name: DataTypes.STRING,
    user: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Folder',
  });
  return Folder;
};