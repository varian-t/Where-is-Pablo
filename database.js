const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

const User = sequelize.define('User', {
    id: { type: DataTypes.STRING, primaryKey: true },
    points: { type: DataTypes.INTEGER, defaultValue: 0 },
    submittedToday: { type: DataTypes.BOOLEAN, defaultValue: false},
    submittedTotal: { type: DataTypes.INTEGER, defaultValue: 0},
    topPostUser: { type: DataTypes.INTEGER, defaultValue: 0},
});

const Config = sequelize.define('Config', {
  guildId: { type: DataTypes.STRING, primaryKey: true },
  submissionChannelId: { type: DataTypes.STRING },
  photoDay: { type: DataTypes.STRING }, // Stores the day of the week 
  photoTime: { type: DataTypes.STRING }, // Stores the time in "HH:mm" format

  topPostOfTheDayScore: { type: DataTypes.INTEGER, defaultValue: 0 },//Stores the link to the top image
  topPostOfTheDayUser: { type: DataTypes.STRING },//Stores the link to the top image
  topPostOfTheDayLink: { type: DataTypes.STRING },//Stores the link to the top image

  topPostOfTheWeekScore: { type: DataTypes.INTEGER, defaultValue: 0 },//Stores the link to the top image
  topPostOfTheWeekUser: { type: DataTypes.STRING },//Stores the link to the top image
  topPostOfTheWeekLink: { type: DataTypes.STRING },//Stores the link to the top image

  dailyPostChannelId: { type: DataTypes.STRING },
});


sequelize.sync({ alter: true }) // ✅ Alter existing tables instead of creating new ones
    .then(() => console.log('✅ Database synced!'))
    .catch(err => console.error('❌ Database sync failed:', err));


module.exports = { sequelize, User, Config };
