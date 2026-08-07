const Tesseract = require("tesseract.js");
const path = require("path");
const fs = require("fs");

/**
 * AI OCR Verification Reader for Task Screenshot Proofs
 * @param {String} imagePath - Path to uploaded screenshot file
 * @param {String} taskTitle - Task title
 * @param {String} taskDescription - Task description
 * @returns {Promise<{isValid: boolean, confidence: number, extractedText: string, reason: string}>}
 */
const verifyScreenshotProof = async (imagePath, taskTitle = "", taskDescription = "") => {
  try {
    const fullPath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
    if (!fs.existsSync(fullPath)) {
      return { isValid: false, confidence: 0, extractedText: "", reason: "Image file not found." };
    }

    console.log("🤖 Running AI OCR Reader on screenshot:", fullPath);

    // Run Tesseract OCR Text Extraction
    const { data: { text, confidence } } = await Tesseract.recognize(fullPath, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const cleanText = text.toLowerCase();
    const cleanTitle = taskTitle.toLowerCase();
    const cleanDesc = taskDescription.toLowerCase();

    console.log("🤖 Extracted OCR Text:", cleanText);

    let isMatch = false;
    let matchReason = "";

    // 1. Social Follow Keywords
    if (cleanTitle.includes("instagram") || cleanTitle.includes("follow") || cleanDesc.includes("follow")) {
      const followKeywords = ["following", "followed", "message", "posts", "followers", "requested", "profile"];
      const foundKeyword = followKeywords.find((kw) => cleanText.includes(kw));
      if (foundKeyword) {
        isMatch = true;
        matchReason = `Detected social status: '${foundKeyword}'`;
      }
    }

    // 2. Play Store Review Keywords
    if (!isMatch && (cleanTitle.includes("play store") || cleanTitle.includes("review") || cleanTitle.includes("star") || cleanDesc.includes("review"))) {
      const reviewKeywords = ["reviewed", "rated", "star", "stars", "edit your review", "quietchat", "useful", "app"];
      const foundKeyword = reviewKeywords.find((kw) => cleanText.includes(kw));
      if (foundKeyword) {
        isMatch = true;
        matchReason = `Detected review status: '${foundKeyword}'`;
      }
    }

    // 3. YouTube / Telegram Keywords
    if (!isMatch && (cleanTitle.includes("youtube") || cleanTitle.includes("subscribe") || cleanTitle.includes("telegram") || cleanDesc.includes("subscribe"))) {
      const subKeywords = ["subscribed", "subscriber", "subscribers", "joined", "member", "members", "bell"];
      const foundKeyword = subKeywords.find((kw) => cleanText.includes(kw));
      if (foundKeyword) {
        isMatch = true;
        matchReason = `Detected subscription status: '${foundKeyword}'`;
      }
    }

    // 4. Keyword overlap fallback check with task title words
    if (!isMatch) {
      const titleWords = cleanTitle.split(/\s+/).filter((w) => w.length > 3 && !["with", "from", "your", "this", "have"].includes(w));
      const matchedTitleWord = titleWords.find((word) => cleanText.includes(word));
      if (matchedTitleWord) {
        isMatch = true;
        matchReason = `Matched task keyword: '${matchedTitleWord}'`;
      }
    }

    return {
      isValid: isMatch,
      confidence: confidence || 0,
      extractedText: text.trim(),
      reason: isMatch ? matchReason : "Screenshot keywords did not match required task proof.",
    };
  } catch (error) {
    console.error("AI OCR verification error:", error);
    return { isValid: false, confidence: 0, extractedText: "", reason: error.message || "OCR engine error" };
  }
};

module.exports = verifyScreenshotProof;
