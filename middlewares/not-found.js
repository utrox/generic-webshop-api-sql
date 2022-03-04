const notFound = (req, res) => {
  return res.status(400).json({ error: "The requested page does not exist." });
};

module.exports = notFound;
