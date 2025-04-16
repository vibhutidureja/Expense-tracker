document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Update welcome message
    document.getElementById('welcome-message').textContent += currentUser;

    // Handle logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    });

    // Theme toggle functionality
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (prefersDarkScheme.matches ? 'dark' : 'light');

    function setTheme(isDark) {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    }

    setTheme(initialTheme === 'dark');
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) setTheme(e.matches);
    });
    themeToggleBtn.addEventListener('click', () => {
        setTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
    });

    // Initialize data
    let expenses = JSON.parse(localStorage.getItem(`${currentUser}_expenses`)) || [];
    let categories = JSON.parse(localStorage.getItem(`${currentUser}_categories`)) || [
        'Food & Groceries', 'Transportation', 'Housing & Rent', 'Utilities',
        'Bills & Subscriptions', 'Healthcare', 'Education', 'Entertainment',
        'Shopping', 'Personal Care', 'Travel', 'Insurance', 'Taxes',
        'Savings & Investments', 'Gifts & Donations', 'Other'
    ];

    // DOM Elements
    const elements = {
        categorySelect: document.getElementById('category-select'),
        newCategoryInput: document.getElementById('new-category-input'),
        amountInput: document.getElementById('amount-input'),
        dateInput: document.getElementById('date-input'),
        expensesTableBody: document.getElementById('expense-table-body'),
        totalAmountCell: document.getElementById('total-amount'),
        periodSelect: document.getElementById('period-select'),
        periodTotal: document.getElementById('period-total'),
        categorySummary: document.getElementById('category-summary'),
        filterCategory: document.getElementById('filter-category'),
        filterPeriod: document.getElementById('filter-period'),
        searchInput: document.getElementById('search-input'),
        highestExpenseElement: document.getElementById('highest-expense'),
        lowestExpenseElement: document.getElementById('lowest-expense'),
        averageExpenseElement: document.getElementById('average-expense'),
        emptyState: document.getElementById('empty-state')
    };

    // Save data to localStorage
    function saveData() {
        localStorage.setItem(`${currentUser}_expenses`, JSON.stringify(expenses));
        localStorage.setItem(`${currentUser}_categories`, JSON.stringify(categories));
    }

    // Initialize categories in select elements
    function initializeCategories() {
        elements.categorySelect.innerHTML = '<option value="">Select a category</option>';
        elements.filterCategory.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            elements.categorySelect.appendChild(option.cloneNode(true));
            elements.filterCategory.appendChild(option);
        });
    }

    // Add new category
    document.getElementById('add-category-btn').addEventListener('click', () => {
        const newCategory = elements.newCategoryInput.value.trim();
        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            initializeCategories();
            elements.newCategoryInput.value = '';
            saveData();
        }
    });

    // Delete selected category
    document.getElementById('delete-category-btn').addEventListener('click', () => {
        const selectedCategory = elements.categorySelect.value;
        if (selectedCategory && confirm(`Delete category "${selectedCategory}" and all its expenses?`)) {
            categories = categories.filter(c => c !== selectedCategory);
            expenses = expenses.filter(e => e.category !== selectedCategory);
            initializeCategories();
            updateUI();
            saveData();
        }
    });

    // Update all UI elements
    function updateUI() {
                renderExpenses();
                updateExpenseAnalysis();
                updateCategorySummary();
                updatePeriodTotal();
    }

    // Render expenses table
    function renderExpenses() {
        const filteredExpenses = filterExpenses();
        elements.expensesTableBody.innerHTML = '';
        let filteredTotal = 0;

        if (filteredExpenses.length === 0) {
            elements.emptyState.style.display = 'block';
            elements.expensesTableBody.style.display = 'none';
        } else {
            elements.emptyState.style.display = 'none';
            elements.expensesTableBody.style.display = 'table-row-group';
        }

        filteredExpenses.forEach((expense, index) => {
            filteredTotal += expense.amount;
            const row = elements.expensesTableBody.insertRow();
            
            row.insertCell().textContent = expense.category;
            row.insertCell().textContent = `$${expense.amount.toFixed(2)}`;
            row.insertCell().textContent = new Date(expense.date).toLocaleDateString();
            
            const actionCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'edit-btn';
            editBtn.onclick = () => editExpense(index);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => deleteExpense(index);
            
            actionCell.appendChild(editBtn);
            actionCell.appendChild(deleteBtn);
        });

        elements.totalAmountCell.textContent = `$${filteredTotal.toFixed(2)}`;
    }

    // Edit expense
    function editExpense(index) {
        const expense = expenses[index];
        elements.categorySelect.value = expense.category;
        elements.amountInput.value = expense.amount;
        elements.dateInput.value = expense.date;
        
        const originalAddBtn = document.getElementById('add-btn');
        originalAddBtn.textContent = 'Update';
        
        const newAddBtn = originalAddBtn.cloneNode(true);
        originalAddBtn.parentNode.replaceChild(newAddBtn, originalAddBtn);
        
        newAddBtn.onclick = () => {
            expenses[index] = {
                category: elements.categorySelect.value,
                amount: Number(elements.amountInput.value),
                date: elements.dateInput.value
            };
            saveData();
            updateUI();
            resetForm();
        };
    }

    // Delete expense
    function deleteExpense(index) {
        if (confirm('Delete this expense?')) {
            expenses.splice(index, 1);
            saveData();
            updateUI();
        }
    }

    // Reset form
    function resetForm() {
        elements.categorySelect.value = '';
        elements.amountInput.value = '';
        elements.dateInput.value = '';
        document.getElementById('add-btn').textContent = 'Add';
    }

    // Filter expenses
    function filterExpenses() {
        const searchTerm = elements.searchInput.value.toLowerCase();
        const categoryFilter = elements.filterCategory.value;
        const periodFilter = elements.filterPeriod.value;
        const now = new Date();

        return expenses.filter(expense => {
            const matchesSearch = expense.category.toLowerCase().includes(searchTerm) ||
                                expense.amount.toString().includes(searchTerm) ||
                                expense.date.includes(searchTerm);
            const matchesCategory = !categoryFilter || expense.category === categoryFilter;
            let matchesPeriod = true;

            if (periodFilter === 'this-month') {
                const expenseDate = new Date(expense.date);
                matchesPeriod = expenseDate.getMonth() === now.getMonth() &&
                               expenseDate.getFullYear() === now.getFullYear();
            } else if (periodFilter === 'this-year') {
                const expenseDate = new Date(expense.date);
                matchesPeriod = expenseDate.getFullYear() === now.getFullYear();
            }

            return matchesSearch && matchesCategory && matchesPeriod;
        });
    }

    // Update expense analysis
    function updateExpenseAnalysis() {
        if (expenses.length === 0) {
            elements.highestExpenseElement.textContent = '$0';
            elements.lowestExpenseElement.textContent = '$0';
            elements.averageExpenseElement.textContent = '$0';
            return;
        }

        const amounts = expenses.map(e => e.amount);
        elements.highestExpenseElement.textContent = `$${Math.max(...amounts).toFixed(2)}`;
        elements.lowestExpenseElement.textContent = `$${Math.min(...amounts).toFixed(2)}`;
        elements.averageExpenseElement.textContent = `$${(amounts.reduce((a, b) => a + b, 0) / amounts.length).toFixed(2)}`;
    }

    // Update category summary
    function updateCategorySummary() {
        elements.categorySummary.innerHTML = '';
        const summary = {};

        expenses.forEach(expense => {
            summary[expense.category] = (summary[expense.category] || 0) + expense.amount;
        });

        Object.entries(summary).forEach(([category, amount]) => {
            const item = document.createElement('div');
            item.className = 'category-summary-item';
            item.innerHTML = `<span>${category}:</span><span>$${amount.toFixed(2)}</span>`;
            elements.categorySummary.appendChild(item);
        });
    }

    // Update period total
    function updatePeriodTotal() {
        const period = elements.periodSelect.value;
        const now = new Date();
        let filteredExpenses = expenses;

        if (period === 'month') {
            filteredExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getMonth() === now.getMonth() &&
                       expenseDate.getFullYear() === now.getFullYear();
            });
        } else if (period === 'year') {
            filteredExpenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getFullYear() === now.getFullYear();
            });
        }

        const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        elements.periodTotal.textContent = `Total: $${total.toFixed(2)}`;
    }

    // Add new expense
    document.getElementById('add-btn').addEventListener('click', () => {
        const category = elements.categorySelect.value;
        const amount = Number(elements.amountInput.value);
        const date = elements.dateInput.value;

        if (!category || !amount || !date) {
            alert('Please fill in all fields');
            return;
        }

        expenses.push({ category, amount, date });
        saveData();
        updateUI();
        resetForm();
    });

    // Event listeners for filters
    elements.searchInput.addEventListener('input', renderExpenses);
    elements.filterCategory.addEventListener('change', renderExpenses);
    elements.filterPeriod.addEventListener('change', renderExpenses);
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        elements.searchInput.value = '';
        elements.filterCategory.value = '';
        elements.filterPeriod.value = '';
        renderExpenses();
    });

    // Delete all expenses
    document.getElementById('delete-all-btn').addEventListener('click', () => {
        if (confirm('Delete all expenses?')) {
            expenses = [];
            saveData();
            updateUI();
        }
    });

    // Initialize
    initializeCategories();
    updateUI();
});