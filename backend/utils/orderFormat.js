// Same short id as the website shows: "#A1B2C3"
exports.shortOrderId = (id) => `#${String(id).slice(-6).toUpperCase()}`;

// 1234.5 -> "1,234.50"
exports.money = (amount) =>
    Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

exports.formatDate = (date) =>
    new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

exports.escapeHtml = (text) =>
    String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
