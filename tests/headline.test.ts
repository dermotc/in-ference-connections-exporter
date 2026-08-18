import { parseHeadline } from '../src/domain/headline';

test('splits "Title at Employer"', () => {
  expect(parseHeadline('Head of Product at Acme')).toEqual({
    title: 'Head of Product',
    employer: 'Acme',
  });
});

test('splits "Title @ Employer"', () => {
  expect(parseHeadline('Senior Engineer @ Stripe')).toEqual({
    title: 'Senior Engineer',
    employer: 'Stripe',
  });
});

test('splits "Title — Employer" (em dash)', () => {
  expect(parseHeadline('VP Engineering — TechCo')).toEqual({
    title: 'VP Engineering',
    employer: 'TechCo',
  });
});

test('uses the leftmost delimiter when multiple could match', () => {
  // "at" appears twice; must split on the FIRST occurrence, not the last.
  expect(parseHeadline('Working at scale as Engineer at Acme')).toEqual({
    title: 'Working',
    employer: 'scale as Engineer at Acme',
  });
});

test('never fabricates — no recognised delimiter returns both empty', () => {
  // "Freelance Consultant" has no "at"/"@"/"—" — must NOT guess the whole
  // string is the title, or the employer. Honesty contract: absent, not guessed.
  expect(parseHeadline('Freelance Consultant')).toEqual({ title: '', employer: '' });
});

test('never fabricates — empty headline returns both empty', () => {
  expect(parseHeadline('')).toEqual({ title: '', employer: '' });
});

test('never fabricates — delimiter with nothing on one side returns both empty', () => {
  // "at Acme" alone has no title text before the delimiter — not a real split.
  expect(parseHeadline('at Acme')).toEqual({ title: '', employer: '' });
  expect(parseHeadline('Head of Product at')).toEqual({ title: '', employer: '' });
});

test('trims surrounding whitespace on both sides', () => {
  expect(parseHeadline('  Head of Product   at   Acme  ')).toEqual({
    title: 'Head of Product',
    employer: 'Acme',
  });
});

test('does not false-split on "at" embedded in a word (e.g. "Data")', () => {
  // A naive `.indexOf('at')` (no surrounding spaces) would match inside "Data"
  // itself and produce a garbage split. The delimiter must require spaces on
  // both sides, so a headline with no real " at "/" @ "/" — " token stays unsplit.
  expect(parseHeadline('Data Analyst')).toEqual({ title: '', employer: '' });
});
