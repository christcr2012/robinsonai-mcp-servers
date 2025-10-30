/**
 * Formats a given number into a currency string.
 *
 * @param {number} amount - The number to be formatted as currency.
 * @returns {string} - The formatted currency string.
 */
export function formatCurrency(amount: number): string {
    // Check if the number is negative and handle it accordingly
    const isNegative = amount < 0;
    let absAmount = Math.abs(amount);

    // Convert the number to a fixed-point notation with 2 decimal places
    absAmount = parseFloat(absAmount.toFixed(2));

    // Format the number with commas as thousands separators
    const parts = absAmount.toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const decimalPart = parts.length > 1 ? `.${parts[1]}` : '.00';

    // Combine the parts and add a negative sign if necessary
    const formattedAmount = isNegative ? '-' : '';
    return `${formattedAmount}$${integerPart}${decimalPart}`;
}

// Example usage:
console.log(formatCurrency(1234.56)); // Output: "$1,234.56"
console.log(formatCurrency(-1234.56)); // Output: "-$1,234.56"
console.log(formatCurrency(0)); // Output: "$0.00"
console.log(formatCurrency(123456789.123456)); // Output: "$123,456,789.12"

