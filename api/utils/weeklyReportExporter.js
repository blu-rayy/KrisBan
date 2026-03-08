import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import libre from 'libreoffice-convert';
import { formatMMDDYYYY, formatMonthDayYear, parseISODate } from './weeklyReportDates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const convertToPdf = promisify(libre.convert);

const TEMPLATE_PATH = path.resolve(__dirname, '../../progress_report_template.docx');

const buildRowPayload = (entries = []) => {
  const payload = {};
  const emptyMarkers = [];

  for (let row = 1; row <= 6; row += 1) {
    const entry = entries.find((item) => Number(item.rowNumber) === row);
    const marker = `[[REMOVE_ROW_${row}]]`;
    const hasActivity = Boolean(String(entry?.rowActivity || '').trim());

    if (entry?.rowDate && hasActivity) {
      payload[`row${row}_date`] = formatMMDDYYYY(parseISODate(entry.rowDate));
      payload[`row${row}_activity`] = entry.rowActivity;
      continue;
    }

    payload[`row${row}_date`] = marker;
    payload[`row${row}_activity`] = marker;
    emptyMarkers.push(marker);
  }

  return { payload, emptyMarkers };
};

const removeEmptyRows = (docxBuffer, emptyMarkers = []) => {
  if (emptyMarkers.length === 0) {
    return docxBuffer;
  }

  const zip = new PizZip(docxBuffer);
  const documentXmlPath = 'word/document.xml';
  const documentXmlFile = zip.file(documentXmlPath);
  if (!documentXmlFile) {
    return docxBuffer;
  }

  let xmlContent = documentXmlFile.asText();

  // Split the document on row-closing tags. Each resulting segment (except the
  // last) holds one row's opening tag + content without its </w:tr>. Filtering
  // out segments that contain a marker and rejoining correctly removes exactly
  // the rows that carry the marker — no cross-table regex hazards.
  for (const marker of emptyMarkers) {
    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const markerRe = new RegExp(escapedMarker);
    const segments = xmlContent.split('</w:tr>');
    const kept = segments.filter((seg) => !markerRe.test(seg));
    xmlContent = kept.join('</w:tr>');
    // Belt-and-suspenders: clear any stray marker text that survived
    xmlContent = xmlContent.replace(new RegExp(escapedMarker, 'g'), '');
  }

  zip.file(documentXmlPath, xmlContent);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
};

const applyTextStyleOverrides = (docxBuffer) => {
  const zip = new PizZip(docxBuffer);
  const documentXmlPath = 'word/document.xml';
  const documentXmlFile = zip.file(documentXmlPath);
  if (!documentXmlFile) {
    return docxBuffer;
  }

  let xmlContent = documentXmlFile.asText();

  // Decrease reporting date font size by 1pt (20 -> 18 half-points in Word XML)
  xmlContent = xmlContent.replace('<w:sz w:val="20"/><w:szCs w:val="20"/>', '<w:sz w:val="18"/><w:szCs w:val="18"/>');

  // Force left alignment to avoid justified spacing in generated activities
  xmlContent = xmlContent.replace(/<w:jc w:val="both"\/>/g, '<w:jc w:val="left"/>');

  zip.file(documentXmlPath, xmlContent);
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
};

const buildTemplateData = (weeklyReport) => {
  const entries = (weeklyReport.entries || []).map((entry) => ({
    rowNumber: entry.rowNumber,
    rowDate: entry.rowDate,
    rowActivity: entry.rowActivity
  }));

  const { payload: rowPayload, emptyMarkers } = buildRowPayload(entries);

  return {
    emptyMarkers,
    data: {
      reporting_date: weeklyReport.reportingDate,
      report_week: weeklyReport.reportWeek,
      signatory_date: formatMonthDayYear(parseISODate(weeklyReport.signatoryDate)),
      ...rowPayload
    }
  };
};

export const renderWeeklyReportDocxBuffer = async (weeklyReport) => {
  const templateBuffer = await fs.readFile(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true
  });

  const { data, emptyMarkers } = buildTemplateData(weeklyReport);
  doc.render(data);
  const renderedDocx = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  const styleAdjustedDocx = applyTextStyleOverrides(renderedDocx);

  return removeEmptyRows(styleAdjustedDocx, emptyMarkers);
};

export const exportWeeklyReportPdf = async (weeklyReport) => {
  const docxBuffer = await renderWeeklyReportDocxBuffer(weeklyReport);

  try {
    const pdfBuffer = await convertToPdf(docxBuffer, '.pdf', undefined);
    return pdfBuffer;
  } catch (error) {
    throw new Error(
      `Failed to convert DOCX to PDF. Ensure LibreOffice is installed on the backend host. ${error.message}`
    );
  }
};
