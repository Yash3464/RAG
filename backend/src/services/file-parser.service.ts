// @ts-ignore
import mammoth from "mammoth";
import { extractPdfText } from "./pdf.service";

/**
 * Extracts text from a docx buffer using mammoth
 */
export const extractDocxText = async (buffer: Buffer): Promise<string> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("DOCX parsing error:", error);
    throw new Error("Failed to parse DOCX file");
  }
};

/**
 * Scrapes readable text from a URL
 */
export const scrapeUrlText = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const html = await response.text();

    // Remove head, script, style, and comments
    let text = html
      .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "")
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");

    // Extract text from body
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      text = bodyMatch[1];
    }

    // Convert common tags to newlines or spaces
    text = text
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li>/gi, "\n- ")
      .replace(/<\/h[1-6]>/gi, "\n\n");

    // Strip remaining HTML tags
    text = text.replace(/<[^>]+>/g, " ");

    // Decode HTML entities
    text = text
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'");

    // Collapse whitespace and clean
    text = text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join("\n");

    return text;
  } catch (error) {
    console.error("URL scraping error:", error);
    throw new Error("Failed to scrape URL content");
  }
};

/**
 * Parses and cleans text contents from various input streams
 */
export const parseContent = async (
  bufferOrString: Buffer | string,
  fileNameOrSource: string
): Promise<string> => {
  const extension = fileNameOrSource.split(".").pop()?.toLowerCase();

  if (typeof bufferOrString === "string") {
    // If it's a URL, scrape it
    if (bufferOrString.startsWith("http://") || bufferOrString.startsWith("https://")) {
      return await scrapeUrlText(bufferOrString);
    }
    // Otherwise it is already text
    return bufferOrString;
  }

  // Handle buffer inputs (file uploads)
  switch (extension) {
    case "pdf":
      return await extractPdfText(bufferOrString);
    case "docx":
      return await extractDocxText(bufferOrString);
    case "csv":
    case "xml":
    case "txt":
    default:
      return bufferOrString.toString("utf-8");
  }
};
