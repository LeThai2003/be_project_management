

export const uploadImageSingle = async (req, res, next) => {
  try {
    // console.log(req.body);
    res.json({message: "Upload image success", imageUrl: req.body.image});
  } catch (error) {
    next(error);
  }
}

export const uploadImages = async (req, res, next) => {
  try {
    // console.log(req.body);
    res.json({message: "Upload images success", imagesUrl: req.body.gallery});
  } catch (error) {
    next(error);
  }
}

