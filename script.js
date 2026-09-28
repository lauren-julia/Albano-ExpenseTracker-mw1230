const defaultExpenses = [
  { id: "1", name: "Grocery Store", amount: 142.80, category: "Food", date: "2026-09-14" },
  { id: "2", name: "Electricity Bill", amount: 95.50, category: "Utilities", date: "2026-09-12" },
  { id: "3", name: "Gas Station Fuel", amount: 45.00, category: "Transport", date: "2026-09-10" },
  { id: "4", name: "Movie Tickets", amount: 32.00, category: "Entertainment", date: "2026-09-08" },
  { id: "5", name: "Coffee & Snacks", amount: 18.25, category: "Food", date: "2026-09-05" },
  { id: "6", name: "Internet Subscription", amount: 60.00, category: "Utilities", date: "2026-09-01" }
];

// Pagination Settings
let currentPage = 1;
const itemsPerPage = 5;

// LocalStorage Helper Functions
function getStoredExpenses() {
  try {
    const data = localStorage.getItem('expenses');
    if (!data) {
      localStorage.setItem('expenses', JSON.stringify(defaultExpenses));
      return defaultExpenses;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : defaultExpenses;
  } catch (error) {
    console.error("Error reading expenses from localStorage:", error);
    return defaultExpenses;
  }
}

function saveExpenses(expenses) {
  try {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  } catch (error) {
    console.error("Error saving expenses to localStorage:", error);
  }
}

// Global Delete Action
function deleteExpense(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    let expenses = getStoredExpenses();
    expenses = expenses.filter(item => String(item.id) !== String(id));
    saveExpenses(expenses);
    
    // Refresh view if on expenses list or dashboard page
    if (document.getElementById('expenseTableBody')) {
      loadExpensesTable();
    }
  }
}

// Helper function to safely parse numeric values
function parseAmount(val) {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
}

// 1. Dashboard Page Logic (index.html)
function loadDashboard() {
  const totalSpentEl = document.getElementById('totalSpentStat');
  const topCategoryEl = document.getElementById('topCategoryStat');
  const expenses = getStoredExpenses();

  // Compute stats
  const total = expenses.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  if (totalSpentEl) totalSpentEl.textContent = `₱${total.toFixed(2)}`;

  // Find top spending category
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

// 2. Expenses Table & Pagination Logic (expenses.html)
function loadExpensesTable() {
  const tbody = document.getElementById('expenseTableBody');
  if (!tbody) return; // Exit early if not on expenses.html

  const expenses = getStoredExpenses();
  const totalPages = Math.max(1, Math.ceil(expenses.length / itemsPerPage));

  // Adjust pagination boundary if items are deleted
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = expenses.slice(startIndex, startIndex + itemsPerPage);

  tbody.innerHTML = '';

  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-msg">No expenses found. Click "+ Add Expense" to create one.</td></tr>`;
  } else {
    pageItems.forEach(exp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHTML(exp.name || 'Unnamed')}</td>
        <td>₱${parseAmount(exp.amount).toFixed(2)}</td>
        <td>${escapeHTML(exp.category || 'Uncategorized')}</td>
        <td>${escapeHTML(exp.date || '-')}</td>
        <td>
          <a href="expense-form.html?id=${exp.id}" class="btn-edit">Edit</a>
          <button type="button" class="btn-delete" onclick="deleteExpense('${exp.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Calculate & Display Total
  const grandTotal = expenses.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  const totalRow = document.createElement('tr');
  totalRow.className = 'total-row';
  totalRow.innerHTML = `
    <td>
    <td>
    <td>
    <td>
    <td>Total: &emsp; ₱${grandTotal.toFixed(2)}</td>
  `;
  tbody.appendChild(totalRow);

  // Update Pagination UI
  const pageInfo = document.getElementById('pageInfo');
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');

  if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  if (prevBtn) prevBtn.disabled = (currentPage === 1);
  if (nextBtn) nextBtn.disabled = (currentPage >= totalPages);
}

// 3. Form Add/Edit Handling
function setupFormPage() {
  const form = document.getElementById('expenseForm');
  if (!form) return; // Exit early if not on expense-form.html

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');
  const expenses = getStoredExpenses();

  if (editId) {
    const headingEl = document.getElementById('formHeading');
    if (headingEl) headingEl.textContent = 'Edit Expense';

    const existing = expenses.find(e => String(e.id) === String(editId));
    if (existing) {
      const nameInput = document.getElementById('name');
      const amountInput = document.getElementById('amount');
      const categorySelect = document.getElementById('category');
      const dateInput = document.getElementById('date');

      if (nameInput) nameInput.value = existing.name || '';
      if (amountInput) amountInput.value = existing.amount || '';
      if (categorySelect) categorySelect.value = existing.category || '';
      if (dateInput) dateInput.value = existing.date || '';
    }
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const amount = parseAmount(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    if (!name || amount <= 0 || !category || !date) {
      alert("Please fill in all required fields with valid input.");
      return;
    }

    let currentExpenses = getStoredExpenses();

    if (editId) {
      currentExpenses = currentExpenses.map(item => 
        String(item.id) === String(editId) ? { id: editId, name, amount, category, date } : item
      );
    } else {
      const newExpense = {
        id: Date.now().toString(),
        name,
        amount,
        category,
        date
      };
      currentExpenses.push(newExpense);
    }

    saveExpenses(currentExpenses);
    window.location.href = 'expenses.html';
  });
}

// Helper function to sanitize user input
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initialization Entry Point
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
    nextBtn.addEventListener('click', () => {
      const expenses = getStoredExpenses();
      const totalPages = Math.ceil(expenses.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        loadExpensesTable();
      }
    });
  }
});





////// 
//LOAD EXPENSES
async function loadExpenses(){
    const response = await fetch("/api/expenses");
    const expenses = await response.json();

    const table = document.getElementById("expenseTableBody");
    table.innerHTML = "";

    expenses.forEach(expense => {
        const row =`
            <tr> 
                <td>${expense.id}</td>
                <td>${expense.name}</td>
                <td>${expense.amount}</td>
                <td>${expense.category}</td>
                <td>${expense.date}</td>
            </tr>
        `;

        table.innerHTML += row;
    });
}

//INSERT EXPENSE
async function addExpense(){
    const name = document.getElementById("name").value;
    const amount = document.getElementById("amount").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    const expense = {
        name: name,
        amount: amount,
        category: category,
        date: date
    };

    const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
            "Content-Type":"application/json"
        },
        body: JSON.stringify(expense)
    });

    const result = await response.json();

    alert(result.message);
    document.getElementById("name").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("category").value = "";
    document.getElementById("date").value = "";

    loadExpenses();
}

