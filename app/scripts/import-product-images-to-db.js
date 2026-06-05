const fs = require("fs");
const path = require("path");
const db = require("../models");

const Tutorial = db.tutorials;

async function main() {
  try {
    await db.sequelize.authenticate();

    const tutorials = await Tutorial.findAll({
      attributes: ["id", "imageData", "imageMimeType"],
      order: [["id", "ASC"]],
    });

    let updatedCount = 0;

    for (const tutorial of tutorials) {
      const imagePath = path.join(__dirname, "../public/image", `${tutorial.id}.jpg`);

      if (!fs.existsSync(imagePath)) {
        console.log(`Bỏ qua sản phẩm #${tutorial.id}: không có file ${imagePath}`);
        continue;
      }

      const imageBuffer = fs.readFileSync(imagePath);

      await tutorial.update({
        imageData: imageBuffer,
        imageMimeType: "image/jpeg",
      });

      updatedCount += 1;
      console.log(`Đã lưu ảnh sản phẩm #${tutorial.id} vào database`);
    }

    console.log(`Hoàn tất. Đã cập nhật ${updatedCount}/${tutorials.length} ảnh.`);
  } catch (error) {
    console.error("Import ảnh thất bại:", error);
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
}

main();
