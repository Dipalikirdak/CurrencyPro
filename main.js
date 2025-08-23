document.addEventListener('DOMContentLoaded', function() {
    /* ==============================
       DOM ELEMENTS
    ============================== */
    const convertBtn = document.getElementById('convert-btn');
    const amountInput = document.getElementById('amount');
    const resultBox = document.getElementById('result-box');
    const resultAmount = document.getElementById('result-amount');
    const swapBtn = document.getElementById('swap-btn');
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const rateDisplay = document.getElementById('rate-display');
    const updateTime = document.getElementById('update-time');
    const fromCode = document.getElementById('from-code');

    /* ==============================
       INITIAL SETUP
    ============================== */
    rateDisplay.innerHTML = `<span class="text-gray-700 font-medium">Loading exchange rate...</span>`;

    // Format date for display
    function formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    /* ==============================
       FETCH EXCHANGE RATE
    ============================== */
    async function fetchExchangeRate() {
        const from = fromCurrency.value;
        const to = toCurrency.value;

        // Update currency code next to amount input
        fromCode.textContent = from;

        try {
            // Primary API (ExchangeRate-API)
            const primaryResponse = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
            const primaryData = await primaryResponse.json();

            if (primaryData && primaryData.rates && primaryData.rates[to]) {
                const rate = primaryData.rates[to];
                rateDisplay.innerHTML = `<span class="text-gray-700 font-medium">1 ${from} = ${rate.toFixed(4)} ${to}</span>`;
                updateTime.textContent = formatDate(new Date(primaryData.time_last_updated * 1000));
                return rate;
            } else {
                throw new Error('Primary API response invalid');
            }
        } catch (primaryError) {
            console.log('Primary API failed, trying fallback API...');

            try {
                // Fallback API (Frankfurter)
                const fallbackResponse = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
                const fallbackData = await fallbackResponse.json();

                if (fallbackData && fallbackData.rates && fallbackData.rates[to]) {
                    const rate = fallbackData.rates[to];
                    rateDisplay.innerHTML = `<span class="text-gray-700 font-medium">1 ${from} = ${rate.toFixed(4)} ${to}</span>`;
                    updateTime.textContent = formatDate(new Date());
                    return rate;
                } else {
                    throw new Error('Fallback API response invalid');
                }
            } catch (fallbackError) {
                console.error('Both APIs failed:', fallbackError);
                rateDisplay.innerHTML = `<span class="text-red-600 font-medium">Failed to load rates. Using fallback data.</span>`;

                // Hardcoded fallback rates
                const fallbackRates = {
                    USD: { EUR: 0.85, GBP: 0.73, JPY: 110.45, CAD: 1.25, AUD: 1.32, CHF: 0.92, CNY: 6.45, INR: 74.50, MXN: 20.15, SGD: 1.35, NZD: 1.41, KRW: 1180.50, TRY: 8.65, ZAR: 14.25 },
                    EUR: { USD: 1.18, GBP: 0.86, JPY: 129.89, CAD: 1.47, AUD: 1.55, CHF: 1.08, CNY: 7.60, INR: 87.60, MXN: 23.70, SGD: 1.59, NZD: 1.66, KRW: 1389.00, TRY: 10.18, ZAR: 16.75 },
                    GBP: { USD: 1.37, EUR: 1.16, JPY: 150.20, CAD: 1.71, AUD: 1.80, CHF: 1.26, CNY: 8.80, INR: 101.50, MXN: 27.60, SGD: 1.85, NZD: 1.92, KRW: 1610.00, TRY: 11.80, ZAR: 19.50 },
                    JPY: { USD: 0.0091, EUR: 0.0077, GBP: 0.0067, CAD: 0.011, AUD: 0.012, CHF: 0.0083, CNY: 0.058, INR: 0.67, MXN: 0.18, SGD: 0.012, NZD: 0.013, KRW: 10.70, TRY: 0.078, ZAR: 0.13 },
                    CAD: { USD: 0.80, EUR: 0.68, GBP: 0.58, JPY: 90.50, AUD: 1.06, CHF: 0.74, CNY: 5.15, INR: 59.50, MXN: 16.15, SGD: 1.08, NZD: 1.13, KRW: 945.00, TRY: 6.92, ZAR: 11.40 },
                    AUD: { USD: 0.76, EUR: 0.64, GBP: 0.55, JPY: 82.50, CAD: 0.94, CHF: 0.70, CNY: 4.87, INR: 56.30, MXN: 15.30, SGD: 1.02, NZD: 1.07, KRW: 895.00, TRY: 6.55, ZAR: 10.80 },
                    CHF: { USD: 1.09, EUR: 0.93, GBP: 0.79, JPY: 120.50, CAD: 1.35, AUD: 1.43, CNY: 7.00, INR: 80.80, MXN: 21.95, SGD: 1.47, NZD: 1.53, KRW: 1280.00, TRY: 9.38, ZAR: 15.48 }
                };

                if (fallbackRates[from] && fallbackRates[from][to]) {
                    const rate = fallbackRates[from][to];
                    rateDisplay.innerHTML = `<span class="text-gray-700 font-medium">1 ${from} = ${rate.toFixed(4)} ${to} (fallback)</span>`;
                    updateTime.textContent = "Fallback data";
                    return rate;
                }

                if (fallbackRates.USD[to] && from === 'USD') {
                    const rate = fallbackRates.USD[to];
                    rateDisplay.innerHTML = `<span class="text-gray-700 font-medium">1 ${from} = ${rate.toFixed(4)} ${to} (fallback)</span>`;
                    updateTime.textContent = "Fallback data";
                    return rate;
                }

                // Default fallback
                return 0.85;
            }
        }
    }

    /* ==============================
       CONVERT CURRENCY
    ============================== */
    async function convertCurrency() {
        const amount = parseFloat(amountInput.value);

        // Validate amount
        if (isNaN(amount)) {
            resultBox.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-600 text-sm font-medium">Error</h3>
                        <p class="text-lg font-medium text-red-600 mt-1">Please enter a valid amount</p>
                    </div>
                    <div class="bg-red-100 p-2 rounded-lg">
                        <i class="fas fa-exclamation-circle text-red-600 text-2xl"></i>
                    </div>
                </div>
                <div class="mt-4 text-sm text-gray-500">
                    <p><i class="fas fa-info-circle mr-2"></i>Enter a numeric value to convert</p>
                </div>
            `;
            return;
        }

        if (amount <= 0) {
            resultBox.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-600 text-sm font-medium">Error</h3>
                        <p class="text-lg font-medium text-red-600 mt-1">Amount must be positive</p>
                    </div>
                    <div class="bg-red-100 p-2 rounded-lg">
                        <i class="fas fa-exclamation-circle text-red-600 text-2xl"></i>
                    </div>
                </div>
                <div class="mt-4 text-sm text-gray-500">
                    <p><i class="fas fa-info-circle mr-2"></i>Enter a value greater than zero</p>
                </div>
            `;
            return;
        }

        // Loading state
        resultBox.innerHTML = `
            <div class="flex justify-center items-center py-4">
                <div class="loading-spinner rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <span class="ml-3 text-gray-700">Converting...</span>
            </div>
        `;

        const from = fromCurrency.value;
        const to = toCurrency.value;

        try {
            const rate = await fetchExchangeRate();
            const result = (amount * rate).toFixed(2);

            const formattedAmount = amount.toLocaleString();
            const formattedResult = result.toLocaleString();

            // Success result
            resultBox.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-600 text-sm font-medium">Converted Amount</h3>
                        <p class="text-2xl font-bold text-gray-800 mt-1">${formattedResult} ${to}</p>
                    </div>
                    <div class="bg-green-100 p-2 rounded-lg">
                        <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                    </div>
                </div>
                <div class="mt-4 text-sm text-gray-500">
                    <p><i class="fas fa-info-circle mr-2"></i>${formattedAmount} ${from} = ${formattedResult} ${to}</p>
                    <p class="mt-1"><i class="fas fa-clock mr-2"></i>Last updated: ${updateTime.textContent}</p>
                </div>
            `;

            // Add animation
            resultBox.classList.remove('bg-gradient-to-r', 'from-green-50', 'to-emerald-50');
            setTimeout(() => {
                resultBox.classList.add('bg-gradient-to-r', 'from-green-50', 'to-emerald-50');
            }, 10);
        } catch (error) {
            console.error('Conversion error:', error);

            resultBox.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-gray-600 text-sm font-medium">Error</h3>
                        <p class="text-lg font-medium text-red-600 mt-1">Conversion failed</p>
                    </div>
                    <div class="bg-red-100 p-2 rounded-lg">
                        <i class="fas fa-exclamation-circle text-red-600 text-2xl"></i>
                    </div>
                </div>
                <div class="mt-4 text-sm text-gray-500">
                    <p><i class="fas fa-info-circle mr-2"></i>Please try again later</p>
                </div>
            `;
        }
    }

    /* ==============================
       SWAP CURRENCIES
    ============================== */
    async function swapCurrencies() {
        const fromValue = fromCurrency.value;
        const toValue = toCurrency.value;

        // Swap values
        fromCurrency.value = toValue;
        toCurrency.value = fromValue;

        // Update UI
        fromCode.textContent = fromCurrency.value;

        // Refresh rates & conversion
        await fetchExchangeRate();
        convertCurrency();
    }

    /* ==============================
       EVENT LISTENERS
    ============================== */
    fromCurrency.addEventListener('change', fetchExchangeRate);
    toCurrency.addEventListener('change', fetchExchangeRate);

    convertBtn.addEventListener('click', convertCurrency);
    swapBtn.addEventListener('click', swapCurrencies);

    amountInput.addEventListener('input', () => {
        if (amountInput.value.length > 10) {
            amountInput.value = amountInput.value.slice(0, 10);
        }
    });
    
    /* ==============================
       INITIAL CONVERSION
    ============================== */
    fetchExchangeRate().then(() => {
        convertCurrency();
    });
    
    // Form submission handling
    var form = document.getElementById("my-form");

    async function handleSubmit(event) {
        event.preventDefault();
        var status = document.getElementById("my-form-status");
        var button = document.getElementById("my-form-button");
        var originalText = button.textContent;

        // Update button state
        button.disabled = true;
        button.textContent = "Submitting...";

        var data = new FormData(event.target);
        fetch(event.target.action, {
            method: form.method,
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                status.innerHTML = "Thanks for your submission!";
                status.classList.add('text-green-600');
                form.reset();
            } else {
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        status.innerHTML = data["errors"].map(error => error["message"]).join(", ");
                    } else {
                        status.innerHTML = "Oops! There was a problem submitting your form";
                    }
                    status.classList.add('text-red-600');
                });
            }
        })
        .catch(error => {
            status.innerHTML = "Oops! There was a problem submitting your form";
            status.classList.add('text-red-600');
        })
        .finally(() => {
            // Reset button state
            button.disabled = false;
            button.textContent = originalText;
        });
    }

    form.addEventListener("submit", handleSubmit);
});