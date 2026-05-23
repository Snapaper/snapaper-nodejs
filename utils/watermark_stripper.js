var {
	PDFDocument,
	PDFRawStream,
	PDFName,
	PDFNumber,
	decodePDFRawStream,
} = require("pdf-lib");

// Each papersdaddy watermark lives in a tiny standalone content stream of the
// form  q BT … [<HEX>]TJ ET Q  where <HEX> encodes either "PapersDaddy" or
// "Downloaded for free from www.papersdaddy.com". Matching the literal hex of
// "PapersDaddy" or "papersdaddy" picks up both header and footer reliably; the
// sequences are 22 bytes long and don't collide with anything in a CAIE paper.
const WATERMARK_RE =
	/5061706572734461646479|706170657273646164647[0-9a-f]|PapersDaddy|papersdaddy/i;

async function stripWatermark(pdfBytes) {
	const doc = await PDFDocument.load(pdfBytes, {
		updateMetadata: false,
		ignoreEncryption: true,
	});

	for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
		if (!(obj instanceof PDFRawStream)) continue;
		let decoded;
		try {
			decoded = Buffer.from(decodePDFRawStream(obj).decode()).toString("latin1");
		} catch (_e) {
			continue;
		}
		if (!WATERMARK_RE.test(decoded)) continue;
		const empty = PDFRawStream.of(obj.dict, new Uint8Array(0));
		empty.dict.set(PDFName.of("Length"), PDFNumber.of(0));
		empty.dict.delete(PDFName.of("Filter"));
		doc.context.assign(ref, empty);
	}

	return Buffer.from(await doc.save({ useObjectStreams: false }));
}

module.exports = { stripWatermark };
