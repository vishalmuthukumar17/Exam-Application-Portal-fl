export const normalizeDepartment = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const normalizedKey = raw.toLowerCase().replace(/[^a-z0-9]+/g, '');

  const aliases = {
    cse: 'CSE',
    computerscience: 'CSE',
    computersciences: 'CSE',
    aids: 'AIDS',
    aidsdepartment: 'AIDS',
    aidsengineering: 'AIDS',
    aidsanddatascience: 'AIDS',
    artificialintelligenceanddatascience: 'AIDS',
    artificialintelligencedatascience: 'AIDS',
    aidatascience: 'AIDS',
    aidscience: 'AIDS',
    aidsds: 'AIDS',
  };

  return aliases[normalizedKey] || raw.toUpperCase();
};
