function BMI(heightId, weightId, bmiId) {
    const height = parseFloat(document.getElementById(heightId).value);
    const weight = parseFloat(document.getElementById(weightId).value);

    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
        document.getElementById(bmiId).value = 'Invalid input';
        return;
    }

    const heightInMeters = height * 0.3048;
    const bmi = weight / (heightInMeters ** 2);
    document.getElementById(bmiId).value = bmi.toFixed(2);
}


function previewImage(event, previewId, removeBtnId) {
    const input = event.target;
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById(removeBtnId);
  
    if (input.files && input.files[0]) {
      const reader = new FileReader();
  
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
        removeBtn.style.display = 'inline-block';
      };
  
      reader.readAsDataURL(input.files[0]);
    } else {
      preview.src = '';
      preview.style.display = 'none';
      removeBtn.style.display = 'none';
    }
  }
  
  function removeImage(inputId, previewId, removeBtnId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById(removeBtnId);
  
    input.value = ''; // Reset the file input
    preview.src = ''; // Clear the image source
    preview.style.display = 'none'; // Hide the preview
    removeBtn.style.display = 'none'; // Hide the remove button
  }
  
  









