function ViewBtn(route, id) {
  axios
    .get(`/${route}`, {
      params: {
        id: id,
      },
    })
    .then((response) => {
      // console.log('Success:', response.data);
      window.open(`/${route}?id=${id}`, "_blank");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function BMI(heightId, weightId, bmiId) {
  const height = parseFloat(document.getElementById(heightId).value);
  const weight = parseFloat(document.getElementById(weightId).value);

  if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
    document.getElementById(bmiId).value = "Invalid input";
    return;
  }

  const heightInMeters = height * 0.3048;
  const bmi = weight / heightInMeters ** 2;
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
      preview.style.display = "block";
      removeBtn.style.display = "inline-block";
    };

    reader.readAsDataURL(input.files[0]);
  } else {
    preview.src = "";
    preview.style.display = "none";
    removeBtn.style.display = "none";
  }
}

function removeImage(inputId, previewId, removeBtnId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const removeBtn = document.getElementById(removeBtnId);

  input.value = ""; // Reset the file input
  preview.src = ""; // Clear the image source
  preview.style.display = "none"; // Hide the preview
  removeBtn.style.display = "none"; // Hide the remove button
}

const loadDropdown = (elementId, key, selectedValue = null) => {
  // Append elementId to the URL as a query parameter
  const modifiedUrl = `getDataFromField?elementId=${elementId}`;

  fetch(modifiedUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error fetching data from ${modifiedUrl}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      const dropdown = document.getElementById(elementId);
      dropdown.innerHTML = '<option value="">Select</option>'; // Clear existing options and add a default one

      // Loop through the data to create options
      data.data.forEach((item) => {
        const option = document.createElement("option");

        // If elementId is "Doctor", set value as item.id, otherwise use item[key]
        option.value = elementId === "Doctor" ? item.id : item[key];
        option.textContent = item[key]; // Display text remains the same
        option.setAttribute("data-id", item.id); // Set data-id attribute

        dropdown.appendChild(option);
      });

      // Add "Add New" option **only if elementId is "Specialization"**
      if (elementId === "Specialization") {
        const addNewOption = document.createElement("option");
        addNewOption.value = "add-new";
        addNewOption.textContent = "Add New";
        dropdown.appendChild(addNewOption);
      }

      // Set the value after the dropdown has been populated
      if (selectedValue) {
        dropdown.value = selectedValue;
      }
    })
    .catch((error) =>
      console.error(`Error fetching ${elementId} details:`, error)
    );
};

const generateQRCodeInDiv = (divId, route, clinicId) => {
  // Get the window.origin (base URL)
  const windowOrigin = window.origin;

  // Construct the URL
  const url = `${windowOrigin}/${route}?clinic_id=${clinicId}`;

  // Find the div where the QR code will be generated
  const targetDiv = document.getElementById(divId);

  if (targetDiv) {
    targetDiv.innerHTML = "";

    // Generate the QR code
    QRCode.toDataURL(url, function (err, url) {
      if (err) {
        console.error("Error generating QR code:", err);
      } else {
        // Create an image element for the QR code
        const imgElement = document.createElement("img");
        imgElement.src = url;
        targetDiv.appendChild(imgElement);
      }
    });
  } else {
    console.error("No div found with the ID:", divId);
  }
};

async function saveJsonForm(formId, endpoint, arrayObj = null) {
  return new Promise(async (resolve, reject) => {
    try {
      const form = document.getElementById(formId.substring(1));
      if (!form) throw new Error(`Form with ID '${formId}' not found.`);

      // Collect form data as a JSON object
      const formData = new FormData(form);
      const jsonData = {};
      for (let [key, value] of formData.entries()) {
        jsonData[key] = value;
      }

      // Merge arrayObj into jsonData if provided
      if (arrayObj && Array.isArray(arrayObj)) {
        arrayObj.forEach((item) => {
          for (let key in item) {
            if (item.hasOwnProperty(key)) {
              // If the key already exists, append data; otherwise, set it
              if (Array.isArray(jsonData[key])) {
                jsonData[key] = [...jsonData[key], ...item[key]];
              } else {
                jsonData[key] = item[key];
              }
            }
          }
        });
      }

      console.log("Form data as JSON after adding arrayObj:", jsonData);

      // Submit the JSON data using axios
      const response = await axios.post(endpoint, jsonData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      resolve(response.data);
    } catch (error) {
      console.error("Error submitting the JSON form:", error);
      reject(error.response ? error.response.data : error);
    }
  });
}
