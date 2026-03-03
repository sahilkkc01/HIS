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
        const inputValue = $input.val().trim();

        if (validationRules) {
            const rules = validationRules.split(' ');
            let isRequired = rules.includes('required');
            let isEmail = rules.includes('email');
            let isMobileNum = rules.includes('mobileNum');
            let isGreaterThanZero = rules.includes('greaterThanZero');
            let isFutureDate = rules.includes('futureDate'); // New validation for date

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

            // Check if the value should be greater than zero
            if (isGreaterThanZero && !isNaN(inputValue) && parseFloat(inputValue) <= 0) {
                isValid = false;
                errorMessage = 'Please enter a value greater than zero.';
                $input.addClass('is-invalid');
            }

            // Check if the date is in the future
            if (isFutureDate && inputValue) {
                let selectedDate = new Date(inputValue);
                let today = new Date();
                today.setHours(0, 0, 0, 0); // Remove time part for comparison
                
                if (selectedDate <= today) {
                    isValid = false;
                    errorMessage = 'Please select a future date.';
                    $input.addClass('is-invalid');
                }
            }
        }
    });

    return { isValid, errorMessage }; // Return only validation results
}


function restrictInput(fieldId, maxLength) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener("input", function() {
            if (field.value.length > maxLength) {
                field.value = field.value.slice(0, maxLength); // Trim the value to the max length
            }
        });
    }
}

function validateFileInput(fileInputId, allowedTypes, maxSizeKB) {
    const fileInput = document.getElementById(fileInputId);
    const file = fileInput.files[0];

    if (!file) return false;

    const fileSizeInKB = file.size / 1024; // Convert bytes to KB
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Check if the file is of allowed type and not .jfif
    const isAllowedType = allowedTypes.includes(fileType);
    const isNotJFIF = !fileName.endsWith('.jfif'); // Exclude .jfif files by extension

    if (!isAllowedType || !isNotJFIF) {
        alert('Invalid file type. Only ' + allowedTypes.join(', ') + ' files are allowed.');
        fileInput.value = ''; // Reset the file input
        return false;
    }

    // Check if file size exceeds the limit
    if (fileSizeInKB > maxSizeKB) {
        alert('File size exceeds the allowed limit of ' + maxSizeKB + ' KB.');
        fileInput.value = ''; // Reset the file input
        return false;
    }

    return true; // Validation passed
}



