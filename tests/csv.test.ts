import { buildCsv } from '../src/export/csv';
import { Connection } from '../src/domain/connection';

const sample: Connection = {
  name: 'Alice Smith',
  profileUrl: 'https://www.linkedin.com/in/alice',
  headline: 'Engineer at Acme',
  title: 'Engineer',
  employer: 'Acme',
  connectedOn: 'Connected on Jan 1, 2025',
  messageUrl: 'https://www.linkedin.com/messaging/compose/?foo=bar',
};

test('builds CSV with header', () => {
  const csv = buildCsv([sample]);
  expect(csv).toContain('name,profileUrl,employer,title,headline,connectedOn,messageUrl');
  expect(csv).toContain('Alice Smith');
});

test('includes parsed employer and title columns', () => {
  const csv = buildCsv([sample]);
  const lines = csv.split('\r\n');
  expect(lines[1]).toBe(
    'Alice Smith,https://www.linkedin.com/in/alice,Acme,Engineer,Engineer at Acme,"Connected on Jan 1, 2025",https://www.linkedin.com/messaging/compose/?foo=bar',
  );
});

test('honesty contract: unparseable headline leaves employer/title empty, not fabricated', () => {
  const noSplit: Connection = { ...sample, headline: 'Freelance Consultant', title: '', employer: '' };
  const csv = buildCsv([noSplit]);
  const lines = csv.split('\r\n');
  expect(lines[1]).toBe(
    'Alice Smith,https://www.linkedin.com/in/alice,,,Freelance Consultant,"Connected on Jan 1, 2025",https://www.linkedin.com/messaging/compose/?foo=bar',
  );
});

test('escapes double quotes', () => {
  const conn: Connection = { ...sample, name: 'Say "Hello"' };
  const csv = buildCsv([conn]);
  expect(csv).toContain('"Say ""Hello"""');
});

test('formula injection: prefixes = with tab', () => {
  const conn: Connection = { ...sample, name: '=SUM(A1)' };
  const csv = buildCsv([conn]);
  expect(csv).toContain('\t=SUM(A1)');
});

test('formula injection: prefixes + with tab', () => {
  const conn: Connection = { ...sample, headline: '+malicious' };
  const csv = buildCsv([conn]);
  expect(csv).toContain('\t+malicious');
});

test('empty connections returns only header', () => {
  const csv = buildCsv([]);
  const lines = csv.split('\r\n').filter(Boolean);
  expect(lines).toHaveLength(1);
  expect(lines[0]).toBe('name,profileUrl,employer,title,headline,connectedOn,messageUrl');
});
