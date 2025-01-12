async function saveForm(formId, endpoint) {
    return new Promise(async (resolve, reject) => {
        try {
            const form = document.getElementById(formId);
            if (!form) throw new Error(`Form with ID '${formId}' not found.`);
            
            form.addEventListener('submit', (event) => {
                event.preventDefault();
            });
            
            const formData = new FormData(form);
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }
            const response = await axios.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            resolve(response.data);
        } catch (error) {
            console.error('Error submitting the form:', error);
            reject(error.response ? error.response.data : error);
        }
    });
}
