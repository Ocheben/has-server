const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

 const hashPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8))
  }
  /**
   * comparePassword
   * @param {string} hashPassword 
   * @param {string} password 
   * @returns {Boolean} return True or False
   */
  const comparePassword =(hashPassword, password) => {
    return bcrypt.compareSync(password, hashPassword);
  }
  /**
   * isValidEmail helper method
   * @param {string} email
   * @returns {Boolean} True or False
   */
  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  }
  /**
   * Gnerate Token
   * @param {string} id
   * @returns {string} token
   */
  const generateToken = (id) => {
    const token = jwt.sign({
      userId: id
    },
      process.env.SECRET, { expiresIn: '7d' }
    );
    return token;
  }


module.exports = {
    hashPassword,
    comparePassword,
    isValidEmail,
    generateToken
}