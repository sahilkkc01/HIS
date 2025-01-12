function validateForm(formId) {
    console.log("Form submission prevented");
    let isValid = true;
    let errorMessage = '';

    // Reset previous validation states
    $(formId).find('.is-invalid').removeClass('is-invalid');

    const inputs = $(formId).find('input, select, textarea').toArray().reverse();

    inputs.forEach(function(input) {
        const $input = $(input);
        const validationRules = $input.data('validation');
        const customErrorMessage = $input.data('error-message') || 'This field is required.';
        const inputValue = $input.val();

        if (validationRules) {
            const rules = validationRules.split(' ');
            let isRequired = rules.includes('required');
            let isEmail = rules.includes('email');
            let isMobileNum = rules.includes('mobileNum');

            // Check for 'required' first, if applicable
            if (isRequired && !inputValue) {
                isValid = false;
                errorMessage = customErrorMessage;
                $input.addClass('is-invalid');
            }

            // Check 'email' format if present, and if field is not empty
            if (isEmail && inputValue) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(inputValue)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address (e.g., example@domain.com).';
                    $input.addClass('is-invalid');
                }
            }

            // Check 'mobileNum' format if present, and if field is not empty
            if (isMobileNum && inputValue) {
                const mobileRegex = /^[6-9]\d{9}$/;
                if (!mobileRegex.test(inputValue)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid mobile number starting with 6-9 and 10 digits long.';
                    $input.addClass('is-invalid');
                }
            }
        }
    });

    return { isValid, errorMessage }; // Return only validation results
}
