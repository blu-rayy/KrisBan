const safeValue = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  const str = String(value).trim();
  return str || fallback;
};

const toDisplayDate = (isoDate) => {
  if (!isoDate) return 'N/A';
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return safeValue(isoDate, 'N/A');
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });
};

export const parseSmeTemplate = ({ templateContent, sme }) => {
  if (!templateContent || !sme) return '';

  const replacements = {
    '[SME_NAME]': safeValue(sme.name, 'SME'),
    '[SENDER_NAME]': safeValue(sme.pointPerson, 'Sender'),
    '[ORGANIZATION]': safeValue(sme.organization, 'Organization'),
    '[SME_TITLE]': safeValue(sme.title, 'Subject Matter Expert'),
    '[LAST_CONTACT_DATE]': toDisplayDate(sme.lastContactDate)
  };

  return Object.entries(replacements).reduce((result, [tag, value]) => {
    const regex = new RegExp(tag.replace(/[[\]]/g, '\\$&'), 'g');
    return result.replace(regex, value);
  }, templateContent);
};