const promisifyDbQuery = (db, sqlQuery, queryParams) => {
  return new Promise((resolve, reject) => {
    db.query(sqlQuery, queryParams, (err, res) => {
      if (err) {
        if (err.code === "ER_BAD_NULL_ERROR") {
          return reject({
            status: 404,
            message: `Invalid category name. Please check if you've entered a correct category name. `,
          });
        }
        if (err.code === "ER_DUP_ENTRY") {
          return reject(
            {
              status: 409,
              message: `${err.sqlMessage.split("'")[1]} is already in use.`,
            },
            null
          );
        }
        reject(err);
      } else resolve(res);
    });
  });
};

module.exports = promisifyDbQuery;
