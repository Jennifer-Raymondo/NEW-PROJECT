document.addEventListener('DOMContentLoaded', () => {

  // Helper function: validate positive numbers
  function isPositiveNumber(value) {
    return !isNaN(value) && Number(value) > 0;
  }

  // Main validation function
  function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', function(e) {
      let valid = true;
      const inputs = form.querySelectorAll('input[type="number"]');

      inputs.forEach(input => {
        if (!isPositiveNumber(input.value)) {
          alert(`The field "${input.name}" must be a positive number.`);
          input.focus();
          valid = false;
        }
      });

      if (!valid) e.preventDefault(); // stop submission if invalid
    });
  }

  // Apply validation to all forms by ID
  validateForm('addStockForm');     // New Stock
  validateForm('editStockForm');    // Edit Stock
  validateForm('addSaleForm');      // New Sale
  validateForm('editSaleForm');     // Edit Sale
});
