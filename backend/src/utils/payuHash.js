const crypto = require('crypto');

const str = (v) => (v == null ? '' : String(v));

const sha512 = (data) => crypto.createHash('sha512').update(data, 'utf8').digest('hex');

// PayU India initiate hash:
// sha512(key|txnid|amount|productinfo|firstname|email|udf1|...|udf10|salt)
const generatePaymentHash = ({ key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, salt }) => {
    const fields = [key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, salt];
    return sha512(fields.map(str).join('|'));
};

// PayU India response/reverse hash:
// sha512(salt|status|udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
const verifyResponseHash = (response, salt) => {
    const fields = [
        salt,
        response.status,
        response.udf10, response.udf9, response.udf8, response.udf7, response.udf6,
        response.udf5, response.udf4, response.udf3, response.udf2, response.udf1,
        response.email,
        response.firstname,
        response.productinfo,
        response.amount,
        response.txnid,
        response.key
    ];
    const expected = sha512(fields.map(str).join('|'));
    const received = String(response.hash || '').toLowerCase();
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(received, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
};

module.exports = { generatePaymentHash, verifyResponseHash };
