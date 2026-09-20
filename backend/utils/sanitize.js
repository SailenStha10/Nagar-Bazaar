// Returns the value only if it is a plain string, otherwise undefined.
// Query-string params can be coerced into objects/arrays (e.g. ?status[$ne]=x),
// so any value headed into a Mongoose filter must be checked before use —
// express-mongo-sanitize strips the dangerous operator keys, but the
// surrounding object can still slip through and crash a String-typed filter.
const asString = (value) => (typeof value === 'string' ? value : undefined);

module.exports = { asString };
