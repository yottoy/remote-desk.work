/**
 * Text cleaning for scraped job fields.
 *
 * Extracted from src/utils/jobClassifier.js on 2026-05-30 (decouple) so the
 * encoding/clean_text fix can ship WITHOUT the classifier. No classifier code
 * lives in this module.
 *
 *  - cleanText: idempotent; repairs upstream UTF-8/Windows-1252 mojibake
 *    (ftfy-equivalent); decodes HTML entities; strips tags/controls/zero-width;
 *    preserves accents, non-Latin scripts, emoji, currency and punctuation.
 */

'use strict';

// ---------------------------------------------------------------------------
// Encoding repair
// ---------------------------------------------------------------------------

// Windows-1252 high range (0x80-0x9F) -> byte, for reversing mojibake. Keys are written
// as \u escapes so no "smart" punctuation is embedded literally in the source.
const CP1252_HIGH = {
  ['€']: 0x80, ['‚']: 0x82, ['ƒ']: 0x83, ['„']: 0x84, ['…']: 0x85,
  ['†']: 0x86, ['‡']: 0x87, ['ˆ']: 0x88, ['‰']: 0x89, ['Š']: 0x8A,
  ['‹']: 0x8B, ['Œ']: 0x8C, ['Ž']: 0x8E, ['‘']: 0x91, ['’']: 0x92,
  ['“']: 0x93, ['”']: 0x94, ['•']: 0x95, ['–']: 0x96, ['—']: 0x97,
  ['˜']: 0x98, ['™']: 0x99, ['š']: 0x9A, ['›']: 0x9B, ['œ']: 0x9C,
  ['ž']: 0x9E, ['Ÿ']: 0x9F,
};

// Characters that can appear in a mojibake run: Latin-1 supplement (U+00A0-U+00FF) plus the
// cp1252 "specials" that a 0x80-0x9F byte decodes to.
const SPECIALS =
  '\\u0152\\u0153\\u0160\\u0161\\u0178\\u017D\\u017E\\u0192\\u02C6\\u02DC' +
  '\\u2013\\u2014\\u2018-\\u201E\\u2020-\\u2022\\u2026\\u2030\\u2039\\u203A\\u20AC\\u2122';
// Run starts at U+0080 (not U+00A0) so mojibake from an ISO-8859-1 mis-decode — where a
// 0x80-0x9F continuation byte landed as a C1 control char — is still reassembled.
const MOJIBAKE_RUN = new RegExp('[\\u0080-\\u00FF' + SPECIALS + ']{2,}', 'g');

// Mojibake signature: a UTF-8 lead byte mis-decoded to (U+00C2-U+00DF / U+00E2) followed by a
// mis-decoded continuation byte (U+0080-U+00BF) or one of the cp1252 specials.
const MARKER_SRC = '[\\u00C2-\\u00DF\\u00E2][\\u0080-\\u00BF' + SPECIALS + ']';
const MOJIBAKE_MARKER = new RegExp(MARKER_SRC);
function markerCount(s) {
  const m = s.match(new RegExp(MARKER_SRC, 'g'));
  return m ? m.length : 0;
}

function toCp1252Byte(ch) {
  const cp = ch.codePointAt(0);
  if (cp <= 0xFF) return cp; // 0x81,0x8D,0x8F,0x90,0x9D undefined in cp1252 but valid Latin-1
  return CP1252_HIGH[ch] != null ? CP1252_HIGH[ch] : null;
}

function repairRun(run) {
  const bytes = [];
  for (const ch of run) {
    const b = toCp1252Byte(ch);
    if (b == null) return run; // run contains something not cp1252-encodable
    bytes.push(b);
  }
  let decoded;
  try {
    decoded = Buffer.from(bytes).toString('utf8');
  } catch (e) {
    return run;
  }
  if (decoded.indexOf('�') !== -1) return run;           // invalid UTF-8 -> not mojibake
  return markerCount(decoded) < markerCount(run) ? decoded : run; // accept only improvements
}

/**
 * Reverse upstream double-encoding (e.g. "franÃ§ais" -> "français", "dâ€™un" -> "d'un").
 * Idempotent: clean text has no mojibake markers and is returned unchanged.
 */
function repairMojibake(text) {
  if (!text || !MOJIBAKE_MARKER.test(text)) return text;
  let prev = text;
  for (let i = 0; i < 3; i++) {            // loop handles rare double mojibake; converges fast
    const next = prev.replace(MOJIBAKE_RUN, repairRun);
    if (next === prev) break;
    prev = next;
  }
  return prev;
}

// ---------------------------------------------------------------------------
// HTML entity decoding
// ---------------------------------------------------------------------------

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  copy: '©', reg: '®', trade: '™', hellip: '…',
  mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', deg: '°', euro: '€',
  pound: '£', cent: '¢', yen: '¥', bull: '•', middot: '·',
  eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç',
  uuml: 'ü', ouml: 'ö', auml: 'ä', ntilde: 'ñ',
};

function safeFromCodePoint(cp) {
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10FFFF || (cp >= 0xD800 && cp <= 0xDFFF)) return '';
  try { return String.fromCodePoint(cp); } catch (e) { return ''; }
}

function decodeEntities(text) {
  if (text.indexOf('&') === -1) return text;
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeFromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z][a-z0-9]*);/gi, (m, name) => {
      const key = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, key) ? NAMED_ENTITIES[key] : m;
    });
}

// ---------------------------------------------------------------------------
// cleanText
// ---------------------------------------------------------------------------

// C0/C1 controls (except tab/newline/CR), zero-width chars, bidi controls, word joiner, BOM.
// Emoji, accented letters, CJK, currency and ordinary punctuation are NOT in this set.
const CONTROL_AND_ZEROWIDTH = new RegExp(
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F' +
  '\\u200B-\\u200F\\u202A-\\u202E\\u2060\\uFEFF]', 'g');

/**
 * Clean a scraped string. Idempotent: cleanText(cleanText(x)) === cleanText(x).
 */
function cleanText(s) {
  if (s == null || s === '') return s;
  let text = s.toString();

  text = text.replace(/<[^>]+>/g, ' '); // strip HTML tags first
  text = decodeEntities(text);          // then decode entities (so &lt; isn't re-stripped)
  text = repairMojibake(text);          // reverse upstream mojibake

  try { text = text.normalize('NFC'); } catch (e) { /* older runtimes */ }

  text = text.replace(CONTROL_AND_ZEROWIDTH, '');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

module.exports = { cleanText, repairMojibake, decodeEntities };
