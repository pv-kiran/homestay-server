const { COLORS, FONTS, LAYOUT } = require('../../styles/pdfStyles');

const generateFooter = (doc) => {
  const footerTop = doc.page.height - 80;
  const footerWidth = doc.page.width;
  const contentWidth = footerWidth - (LAYOUT.margin * 2);
  const footerY = doc.page.height - 100;
  const footerHeight = 100;

  // Company Information - Right aligned

  // Address and Contact - Right aligned
  doc
  .rect(0, footerY, doc.page.width, footerHeight)
  .fill("#14b8a6")
  .stroke();

  doc
  .fontSize(11)
  .fillColor("#ffffff")
  .font("Helvetica")
  .text("BeStays", 50, doc.page.height - 80, { align: "center" })
  .text("123 Main St, City, Country", { align: "center" })
  .text("Contact: info@company.com | Phone: (123) 456-7890", { align: "center" });

};

module.exports = { generateFooter };