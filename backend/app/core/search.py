"""Persian-aware text normalisation, shared by the search query and the SQL
expression it is matched against.

Persian typed on the web is not a single canonical form. The same product name
reaches us as any of:

* Arabic Yeh/Kaf (ي, ك) instead of Persian Yeh/Keheh (ی, ک) — the single most
  common difference, because many keyboards and older content use the Arabic
  code points;
* a zero-width non-joiner inside compounds («تب‌سنج») where the shopper types a
  plain space, or nothing at all;
* Persian (۰-۹) or Arabic-Indic (٠-٩) digits where the catalog has ASCII;
* optional diacritics and tatweel that carry no lexical meaning.

Postgres has no Persian text-search configuration, so `to_tsvector('persian')`
is not available and a stemmer is out of reach. What *is* both correct and
cheap is to fold all of the above away on both sides and do substring matching
on the result, accelerated by a trigram index.

`NORMALISE_FROM`/`NORMALISE_TO` are fed to SQL's `translate()` so the database
applies exactly the same folding as `normalise_query()` does in Python — one
table, two consumers, no chance of the two drifting apart.
"""

# Characters that map to another character. Order matters only in that FROM
# and TO must line up index-for-index.
_REPLACEMENTS: list[tuple[str, str]] = [
    ("ي", "ی"),  # ARABIC YEH        -> PERSIAN YEH
    ("ى", "ی"),  # ALEF MAKSURA      -> PERSIAN YEH
    ("ك", "ک"),  # ARABIC KAF        -> PERSIAN KEHEH
    ("أ", "ا"),  # ALEF WITH HAMZA   -> ALEF
    ("إ", "ا"),  # ALEF WITH HAMZA   -> ALEF
    ("آ", "ا"),  # ALEF WITH MADDA   -> ALEF
    ("ة", "ه"),  # TEH MARBUTA       -> HEH
    ("ۀ", "ه"),  # HEH WITH YEH ABOVE-> HEH
    # A ZWNJ becomes a space rather than being deleted: «تب‌سنج» then matches a
    # shopper who types «تب سنج», and because the query is tokenised on
    # whitespace and every token must match, «تب‌سنج» still matches itself.
    ("‌", " "),
]
# Persian and Arabic-Indic digits both fold to ASCII, so a SKU or a size typed
# in either numeral set finds the same row.
_REPLACEMENTS += [(chr(0x06F0 + i), str(i)) for i in range(10)]
_REPLACEMENTS += [(chr(0x0660 + i), str(i)) for i in range(10)]

# Characters removed outright. `translate()` deletes any character whose
# position in FROM has no counterpart in TO, so these must come last.
_DELETIONS = (
    "ـ"  # TATWEEL (kashida) — pure decoration
    "ًٌٍَُِّْ"  # harakat
)

NORMALISE_FROM = "".join(src for src, _ in _REPLACEMENTS) + _DELETIONS
NORMALISE_TO = "".join(dst for _, dst in _REPLACEMENTS)

#: Longest query we will tokenise. A search box is not a place to build a
#: 40-clause query; anything beyond this is almost certainly a paste accident.
MAX_TOKENS = 6


def normalise(text: str) -> str:
    """Python twin of the SQL `translate(... NORMALISE_FROM, NORMALISE_TO)`."""
    table = {ord(src): dst for src, dst in _REPLACEMENTS}
    table.update({ord(ch): None for ch in _DELETIONS})
    return text.translate(table).lower()


def tokenize_query(raw: str) -> list[str]:
    """Normalises a raw search string into the tokens that must ALL match.

    AND across tokens, substring within each: «فشارسنج امرن» finds the Omron
    blood-pressure monitor whether the catalog writes it as «فشارسنج دیجیتال
    مچی امرن» or «امرن فشارسنج». Returns an empty list for a query that is
    only punctuation or whitespace, which callers treat as "no search".
    """
    return [t for t in normalise(raw).split() if t][:MAX_TOKENS]
