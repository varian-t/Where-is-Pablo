const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

const User = sequelize.define('User', {
    id: { type: DataTypes.STRING, primaryKey: true },
    points: { type: DataTypes.INTEGER, defaultValue: 0 }
});

const Config = sequelize.define('Config', {
  guildId: { type: DataTypes.STRING, primaryKey: true },
  channelId: { type: DataTypes.STRING },
  photoDay: { type: DataTypes.STRING }, // Stores the day of the week 
  photoTime: { type: DataTypes.STRING } // Stores the time in "HH:mm" format
});


module.exports = { sequelize, User, Config };
