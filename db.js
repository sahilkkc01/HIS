const { Sequelize } = require("sequelize");

<<<<<<< HEAD
const sequelize = new Sequelize("HIS", "root", "root", {
=======
const sequelize = new Sequelize("test", "root", "", {
>>>>>>> 15d431a (Added new features in Kamakhya_dev branch)
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});

const con = async () => {
  try {
    await sequelize.authenticate();
<<<<<<< HEAD

=======
    // sequelize.sync();
>>>>>>> 15d431a (Added new features in Kamakhya_dev branch)
    console.log("Db Connected");
  } catch (error) {
    console.log("Unable to connect to db", error);
  }
};

module.exports = { con, sequelize };
