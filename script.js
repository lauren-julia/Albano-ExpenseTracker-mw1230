let currentPage = 1;
const itemsPerPage = 5;

function parseAmount(val) {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

async function fetchExpensesFromAPI() {
  try {
    const response = await fetch("/api/expenses");
    if (!response.ok) throw new Error("Failed to fetch expenses");
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

async function loadDashboard() {
  const totalSpentEl = document.getElementById('totalSpentStat');
  const topCategoryEl = document.getElementById('topCategoryStat');
  
  if (!totalSpentEl && !topCategoryEl) return;

  const expenses = await fetchExpensesFromAPI();

  // Total Spent
  const total = expenses.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  if (totalSpentEl) totalSpentEl.textContent = `₱${total.toFixed(2)}`;

  // Top Category
  if (topCategoryEl) {
    const counts = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      counts[cat] = (counts[cat] || 0) + parseAmount(e.amount);
    });
    
    let topCat = "None";
    let maxVal = 0;
    for (const [cat, val] of Object.entries(counts)) {
      if (val > maxVal) { 
        maxVal = val; 
        topCat = cat; 
      }
    }
    topCategoryEl.textContent = topCat;
  }
}

async function loadExpensesTable() {
  const tbody = document.getElementById('expenseTableBody');
  if (!tbody) return;

  const expenses = await fetchExpensesFromAPI();
  const totalPages = Math.max(1, Math.ceil(expenses.length / itemsPerPage));

  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = expenses.slice(startIndex, startIndex + itemsPerPage);

  tbody.innerHTML = '';

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No expenses found. Click "+ Add Expense" to create one.</td></tr>`;
  } else {
    pageItems.forEach(exp => {
      const formattedDate = formatDate(exp.date);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(exp.name)}</td>
        <td>₱${parseAmount(exp.amount).toFixed(2)}</td>
        <td>${escapeHTML(exp.category)}</td>
        <td>${escapeHTML(formattedDate)}</td>
        <td>
          <a href="expense-form.html?id=${exp.id}" class="btn-edit">Edit</a>
          <button type="button" class="btn-delete" onclick="deleteExpense('${exp.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Grand Total
  const grandTotal = expenses.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  const totalRow = document.createElement('tr');
  totalRow.className = 'total-row';
  totalRow.innerHTML = `
    <td><strong>Total:</strong></td>
    <td colspan="4"><strong>₱${grandTotal.toFixed(2)}</strong></td>
  `;
  tbody.appendChild(totalRow);

  // Pagination
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = (currentPage === 1);
  if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);
}

// Delete Expense
async function deleteExpense(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      alert(result.message);
      loadExpensesTable();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense.");
    }
  }
}

// Form Add/Edit
async function setupFormPage() {
  const form = document.getElementById('expenseForm');
  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  // If editing, fetch details from API
  if (editId) {
    const headingEl = document.getElementById('formHeading');
    if (headingEl) headingEl.textContent = 'Edit Expense';

    try {
      const response = await fetch(`/api/expenses/${editId}`);
      if (response.ok) {
        const existing = await response.json();
        document.getElementById('name').value = existing.name || '';
        document.getElementById('amount').value = existing.amount || '';
        document.getElementById('category').value = existing.category || '';
        document.getElementById('date').value = formatDate(existing.date);
      }
    } catch (error) {
      console.error("Error loading expense for edit:", error);
    }
  }

  // Handle Submit (Insert or Update)
  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const amount = parseAmount(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    const payload = { name, amount, category, date };

    try {
      let response;
      if (editId) {
        // PUT Request to Update
        response = await fetch(`/api/expenses/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // POST Request to Insert
        response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        window.location.href = 'expenses.html';
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      alert("Failed to save expense.");
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  loadExpensesTable();
  setupFormPage();

  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadExpensesTable();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      const expenses = await fetchExpensesFromAPI();
      const totalPages = Math.ceil(expenses.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        loadExpensesTable();
      }
    });
  }
});
