/**
 * Utilitário Profissional para Sincronização de Calendários Externos
 * Suporta: Google Calendar, Outlook.com, Office 365, Yahoo Calendar, Apple Calendar (iCal/ICS)
 */

export function formatDateToICal(dateStr, addDays = 0) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setDate(date.getDate() + addDays);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}T090000Z`;
}

/**
 * Gera URL de Sincronização para o Google Calendar
 */
export function generateGoogleCalendarUrl({ title, description, dateStr, location = '' }) {
  if (!dateStr) return '#';
  const start = formatDateToICal(dateStr);
  const end = formatDateToICal(dateStr);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `[SIGS] Vencimento: ${title}`,
    details: `${description}\n\n-------------------\nSistema de Gestão SIGS`,
    location: location,
    dates: `${start}/${end}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Gera URL para Outlook Web (Pessoal / Live)
 */
export function generateOutlookWebUrl({ title, description, dateStr, location = '' }) {
  if (!dateStr) return '#';
  const start = new Date(dateStr).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: `[SIGS] Vencimento: ${title}`,
    body: `${description}\n\n-------------------\nSistema de Gestão SIGS`,
    location: location,
    startdt: start,
    enddt: start,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Gera URL para Office 365 Corporativo
 */
export function generateOffice365Url({ title, description, dateStr, location = '' }) {
  if (!dateStr) return '#';
  const start = new Date(dateStr).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: `[SIGS] Vencimento: ${title}`,
    body: `${description}\n\n-------------------\nSistema de Gestão SIGS`,
    location: location,
    startdt: start,
    enddt: start,
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Gera URL para Yahoo Calendar
 */
export function generateYahooCalendarUrl({ title, description, dateStr }) {
  if (!dateStr) return '#';
  const start = formatDateToICal(dateStr);

  const params = new URLSearchParams({
    v: '60',
    title: `[SIGS] Vencimento: ${title}`,
    desc: description,
    st: start,
    dur: '0100',
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Gera e realiza o download de um arquivo .ics com suporte a múltiplos eventos ou evento único
 */
export function downloadICSFile(events = [], filename = 'sigs-agenda.ics') {
  if (!events || events.length === 0) return;

  const todayStr = formatDateToICal(new Date().toISOString());

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SIGS//Gestao de Vigilancia e Licencas//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Vencimentos SIGS',
    'X-WR-TIMEZONE:America/Sao_Paulo',
  ];

  events.forEach((item, index) => {
    if (!item.dateStr) return;
    const start = formatDateToICal(item.dateStr);

    icsLines.push(
      'BEGIN:VEVENT',
      `UID:sigs-${Date.now()}-${index}@sigs.app`,
      `DTSTAMP:${todayStr}`,
      `DTSTART;VALUE=DATE:${start.substring(0, 8)}`,
      `DTEND;VALUE=DATE:${start.substring(0, 8)}`,
      `SUMMARY:[SIGS] Vencimento: ${item.title.replace(/\n/g, ' ')}`,
      `DESCRIPTION:${(item.description || '').replace(/\n/g, '\\n')}`,
      item.location ? `LOCATION:${item.location}` : '',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P7D',
      'ACTION:DISPLAY',
      'DESCRIPTION:Lembrete de Vencimento de Licença',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsLines.push('END:VCALENDAR');

  const cleanLines = icsLines.filter((l) => l !== '');
  const blob = new Blob([cleanLines.join('\r\n')], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
