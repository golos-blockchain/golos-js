const snakeCaseRe = /_([a-z])/g;
export function camelCase(str) {
  return str.replace(snakeCaseRe, function(_m, l) {
    return l.toUpperCase();
  });
}

class _Asset {
  constructor(amount, precision, symbol) {
    if (precision && symbol) {
      this._amount = amount;
      this._precision = precision;
      this._symbol = symbol;
      return;
    }
    const str = amount;
    const asset_parts = str.split(' ');
    this._precision = asset_parts[0].split('.')[1].length;
    this._amount = parseFloat(asset_parts[0]) * Math.pow(10, this._precision);
    this._symbol = asset_parts[1];
  }

  get amount() {
    return this._amount;
  }

  set amount(value) {
    this._amount = value;
  }

  get amountFloat() {
    return this._amount / Math.pow(10, this._precision);
  }

  set amountFloat(value) {
    this._amount = value * Math.pow(10, this._precision);
  }

  get precision() {
    return this._precision;
  }

  set precision(value) {
    this._precision = value;
  }

  get symbol() {
    return this._symbol;
  }

  set symbol(value) {
    this._symbol = value;
  }

  get isUIA() {
    return this._symbol != 'GOLOS' && this._symbol != 'GBG' && this._symbol != 'GESTS';
  }

  toString(decPlaces = undefined) {
    return this.amountFloat.toFixed(decPlaces !== undefined ? decPlaces : this._precision) + ' ' + this._symbol;
  }
}
export function Asset(...args) {
  return new _Asset(...args);
}

export function validateAccountName(value) {
  let i, label, len, suffix;

  suffix = "Account name should ";
  if (!value) {
    return suffix + "not be empty.";
  }
  const length = value.length;
  if (length < 3) {
    return suffix + "be longer.";
  }
  if (length > 16) {
    return suffix + "be shorter.";
  }
  if (/\./.test(value)) {
    suffix = "Each account segment should ";
  }
  const ref = value.split(".");
  for (i = 0, len = ref.length; i < len; i++) {
    label = ref[i];
    if (!/^[a-z]/.test(label)) {
      return suffix + "start with a letter.";
    }
    if (!/^[a-z0-9-]*$/.test(label)) {
      return suffix + "have only letters, digits, or dashes.";
    }
    if (/--/.test(label)) {
      return suffix + "have only one dash in a row.";
    }
    if (!/[a-z0-9]$/.test(label)) {
      return suffix + "end with a letter or digit.";
    }
    if (!(label.length >= 3)) {
      return suffix + "be longer";
    }
  }
  return null;
}
