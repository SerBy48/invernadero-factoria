const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const LETTERS_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;

export function required(value, label) {
  return String(value ?? '').trim() ? '' : `${label} es obligatorio`;
}

export function letters(value, label) {
  const text = String(value ?? '').trim();
  if (!text) return `${label} es obligatorio`;
  return LETTERS_REGEX.test(text) ? '' : `${label} solo puede contener letras y espacios`;
}

export function email(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'El email es obligatorio';
  return EMAIL_REGEX.test(text) ? '' : 'El email debe tener un formato valido';
}

export function phone(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'El telefono es obligatorio';
  return PHONE_REGEX.test(text)
    ? ''
    : 'Usa formato internacional, por ejemplo +573001112233';
}

export function positiveNumber(value, label) {
  if (value === '' || value === null || value === undefined) return `${label} es obligatorio`;
  return Number(value) > 0 ? '' : `${label} debe ser mayor que cero`;
}

export function nonNegativeInteger(value, label) {
  if (value === '' || value === null || value === undefined) return `${label} es obligatorio`;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? '' : `${label} debe ser un numero entero mayor o igual a cero`;
}

export function firstError(errors) {
  return Object.values(errors).find(Boolean) || '';
}

export function trimStrings(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === 'string' ? value.trim() : value,
    ])
  );
}
