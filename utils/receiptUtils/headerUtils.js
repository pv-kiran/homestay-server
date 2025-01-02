const { COLORS, FONTS, LAYOUT } = require('../../styles/pdfStyles');

const generateHeader = (doc, createdDate) => {
  // Company Logo and Name
  doc
    .fontSize(24)
    .font(FONTS.bold)
    .fillColor(COLORS.primary)
    // .text('BESTAYS', LAYOUT.margin, LAYOUT.margin, { continued: true })
    .fillColor(COLORS.text.turquoise)
    .text('BeStays')
    // .moveDown(0.2);

  // Tagline
  doc
    .fontSize(10)
    .font("Helvetica-Oblique")
    .fillColor(COLORS.text.medium)
    .text('Find Your Perfect Home Away From Home')
    .moveDown(0.7);

  // Receipt Details
  const dateObj = new Date(createdDate);
  // Extract date components
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(dateObj.getDate()).padStart(2, '0');
  const time = dateObj.getTime(); // Unique millisecond timestamp

  const startX = doc.page.width - 235;
  const receiptNumber = `INV-${year}${month}${day}-${time}`;
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc
    .fontSize(10)
    .font(FONTS.regular)
    .fillColor(COLORS.text.medium)
    .text('Receipt #:', startX, LAYOUT.margin, { continued: true })
    .font(FONTS.bold)
    .fillColor(COLORS.text.dark)
    .text(`${receiptNumber}`, { align: 'right' })
    .font(FONTS.regular)
    .fillColor(COLORS.text.medium)
    .text('Date:', startX, LAYOUT.margin + 20, { continued: true })
    .font(FONTS.bold)
    .fillColor(COLORS.text.dark)
    .text(`${date}`, { align: 'right' });

  // Decorative Line
  doc
    .moveTo(LAYOUT.margin, LAYOUT.margin + 100)
    .lineTo(doc.page.width - LAYOUT.margin, LAYOUT.margin + 100)
    .lineWidth(1)
    .stroke(COLORS.accent);

  return doc.y + LAYOUT.contentPadding;
};

module.exports = { generateHeader };