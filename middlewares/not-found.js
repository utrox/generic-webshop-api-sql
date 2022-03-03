const notFound = (req, res) => {
  return res.status(400).send("<h2>The requested page does not exist.</h2>");
};

module.exports = notFound;
