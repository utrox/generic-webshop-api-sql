const path = require("path");
const fs = require("fs");
const customError = require("./customError");
const { nanoid } = require("nanoid");
const Image = require("../db/models/Image");

const fileSizeLimit = 1000 * 1000;
const uploadsFolder = path.resolve(__dirname, "..", "public", "uploads");

const handleImages = async ({
  imagesToAdd = [],
  productID,
  imagesToRemove = [],
}) => {
  const imageHandling = {};

  if (imagesToAdd.length > 0) {
    var { imageUploadResults } = await saveImages(imagesToAdd, productID);
    imageHandling.imageUploadResults = imageUploadResults;
  }

  if (imagesToRemove.length > 0) {
    var { imageRemoveResults } = await removeImages(imagesToRemove, productID);
    imageHandling.imageRemoveResults = imageRemoveResults;
  }
  return { imageHandling };
};

const saveImages = async (arrayOfImages, productID) => {
  // check if file is an image, and under the size limit
  var { validatedImages, failedImages } = await validateImages(arrayOfImages);
  // for images that pass validation...
  if (validatedImages) {
    // ... rename them.
    validatedImages = await renameImages(validatedImages, productID);
  }
  const imageUploadResults = {};
  imageUploadResults.failed = failedImages;
  await Image.recordImagesToDb(
    { arrayOfImages: validatedImages, productID },
    (err) => {
      if (err) throw new customError(err.message, err.status);
    }
  );
  imageUploadResults.success = await writeImagesToFile(validatedImages);
  return { imageUploadResults };
};

const validateImages = async (arrayOfImages) => {
  const validatedImages = [];
  const failedImages = [];
  arrayOfImages.forEach((image) => {
    // check if it's an image
    if (!image.mimetype.startsWith("image")) {
      failedImages.push({
        image: image.originalname,
        errorCause: "Please only upload image files.",
      });
      // check if it's under the file size limit
    } else if (image.size > fileSizeLimit) {
      failedImages.push({
        image: image.originalname,
        errorCause: `File over limit. (File: ${image.size}, limit: ${fileSizeLimit} bytes)`,
      });
    } else {
      validatedImages.push(image);
    }
  });
  return { validatedImages, failedImages };
};

const renameImages = async (arrayOfImages, productID) => {
  if (!arrayOfImages) return;

  for await (image of arrayOfImages) {
    image.newName = `${productID}_${nanoid()}.jpg`;
  }

  return arrayOfImages;
};

const writeImagesToFile = async (arrayOfImages) => {
  const uploadedImages = [];
  for await (image of arrayOfImages) {
    const filePath = `${uploadsFolder}\\${image.newName}`;
    await fs.writeFile(filePath, image.buffer, function (err) {
      if (err) {
        console.log(err);
        throw new customError("Please try again.", 500);
      }
    });
    uploadedImages.push({
      newName: image.newName,
      originalName: image.originalname,
    });
  }
  return uploadedImages;
};

const removeImages = async (imagesToRemove = [], product_id) => {
  const imageRemoveResults = {
    success: [],
    failed: [],
  };

  // wait for all promises to fulfill before sending result data.
  await Promise.all(
    imagesToRemove.map(async (image) => {
      await Image.remove({ image, product_id }, (err, result) => {
        if (err || !result.removeSuccessful) {
          imageRemoveResults.failed.push(image);
        } else {
          imageRemoveResults.success.push(image);
          deleteImage(image);
        }
      });
    })
  );
  return { imageRemoveResults };
};

const removeImagesByProductID = async (product_id) => {
  await Image.removeImagesByProductId(product_id, (imagesToRemove) => {
    removeImages(imagesToRemove, product_id);
  });
};

const deleteImage = async (fileName) => {
  const pathToFile = path.resolve(uploadsFolder, fileName);
  if (fs.existsSync(pathToFile)) {
    fs.unlinkSync(pathToFile);
  }
};

module.exports = {
  handleImages,
  removeImagesByProductID,
};
