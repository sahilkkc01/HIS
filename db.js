const { Sequelize } = require("sequelize");



const sequelize = new Sequelize("Test", "root", "", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});
  

// sequelize.sync({ force: true })
const con = async () => {
  try {
    await sequelize.authenticate();
    console.log("Db Connected");
  } catch (error) {
    console.log("Unable to connect to db", error);
  }
};

module.exports = { con, sequelize };
