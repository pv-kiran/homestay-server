const { COLORS, FONTS, LAYOUT } = require('../../styles/pdfStyles');

const generateBookingDetails = (doc, yPosition, bookingData) => {
  // Section Title
  doc
    .fontSize(18)
    .font(FONTS.bold)
    .fillColor(COLORS.text.turquoise)
    .text('Booking Details', LAYOUT.margin, yPosition,{ align: "center", underline: true })
    .moveDown(0.5);

  // Details Box
  const boxWidth = doc.page.width - (LAYOUT.margin * 2);
  const boxHeight = bookingData.length * 35 + 40;
  const boxY = doc.y;

  // Box Shadow and Background
  doc
    .rect(LAYOUT.margin + 2, boxY + 2, boxWidth, boxHeight)
    .fill('#f8fafc')
    .rect(LAYOUT.margin, boxY, boxWidth, boxHeight)
    .fill('white')
    .lineWidth(1)
    .strokeColor(COLORS.border)
    .stroke();

  // Details Content
  let currentY = boxY + 20;
  bookingData.forEach((detail, index) => {
    if (index % 2 === 1) {
      doc
        .rect(LAYOUT.margin, currentY - 5, boxWidth, 30)
        .fill('#f8fafc');
    }

    doc
      .fontSize(10)
      .font(FONTS.bold)
      .fillColor(COLORS.text.medium)
      .text(detail.label, LAYOUT.margin + 20, currentY)
      .font(FONTS.regular)
      .fillColor(COLORS.text.dark)
      .text(detail.value, LAYOUT.margin + 200, currentY);

    currentY += 35;
  });

  return boxY + boxHeight + LAYOUT.contentPadding;
};

module.exports = { generateBookingDetails };