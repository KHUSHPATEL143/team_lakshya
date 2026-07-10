const pdfParse = require('pdf-parse');

const pdfService = {
  // Parse PDF file buffer and extract raw text (optimized for memory efficiency)
  async parsePdf(fileBuffer) {
    try {
      const options = {
        pagerender: function(pageData) {
          return pageData.getTextContent()
            .then(function(textContent) {
              let text = '';
              for (let i = 0; i < textContent.items.length; i++) {
                text += textContent.items[i].str + ' ';
              }
              return text;
            });
        }
      };

      const data = await pdfParse(fileBuffer, options);
      return {
        text: data.text,
        info: data.info || {},
        numpages: data.numpages || 1
      };
    } catch (error) {
      console.error('Error parsing PDF buffer:', error);
      throw new Error(`Failed to parse PDF document: ${error.message}`);
    }
  }
};

module.exports = pdfService;
