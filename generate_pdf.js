const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

async function generatePDF() {
  console.log("Starting PDF generation...");

  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Read the HTML file
    const htmlPath = path.join(__dirname, "generate_pdf.html");
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    // Set content and wait for any dynamic content
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Generate PDF
    const pdfPath = path.join(__dirname, "Resume_Matcher_Documentation.pdf");
    await page.pdf({
      path: pdfPath,
      format: "A4",
      margin: {
        top: "1in",
        right: "1in",
        bottom: "1in",
        left: "1in",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="font-size: 10px; text-align: center; width: 100%; color: #666;">Resume Matcher Documentation - Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    });

    console.log(`PDF generated successfully: ${pdfPath}`);

    await browser.close();
  } catch (error) {
    console.error("Error generating PDF:", error);
    process.exit(1);
  }
}

// Check if puppeteer is installed
try {
  require.resolve("puppeteer");
  generatePDF();
} catch (e) {
  console.log("Puppeteer not found. Installing...");
  const { execSync } = require("child_process");
  try {
    execSync("npm install puppeteer", { stdio: "inherit" });
    console.log("Puppeteer installed successfully. Generating PDF...");
    generatePDF();
  } catch (installError) {
    console.error("Failed to install puppeteer:", installError);
    console.log(
      "\nAlternative: You can manually convert the HTML file to PDF using:"
    );
    console.log("1. Open generate_pdf.html in a web browser");
    console.log("2. Use Ctrl+P (or Cmd+P on Mac) to print");
    console.log('3. Select "Save as PDF" as the destination');
  }
}
