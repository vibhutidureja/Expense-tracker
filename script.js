document.addEventListener('DOMContentLoaded', function() {
    // Dark mode functionality
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Get saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (prefersDarkScheme.matches ? 'dark' : 'light');
    
    function updateThemeIcon(isDark) {
        themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
    }

    function setTheme(isDark) {
        const theme = isDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon(isDark);
    }

    // Initialize theme
    setTheme(initialTheme === 'dark');

    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) { // Only follow system preference if no user preference is set
            setTheme(e.matches);
        }
    });

    // Toggle theme on button click
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        setTheme(!isDark);
    });

    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [
        'Food & Groceries',
        'Transportation',
        'Housing & Rent',
        'Utilities',
        'Bills & Subscriptions',
        'Healthcare',
        'Education',
        'Entertainment',
        'Shopping',
        'Personal Care',
        'Travel',
        'Insurance',
        'Taxes',
        'Savings & Investments',
        'Gifts & Donations',
        'Other'
    ];
    let totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const categorySelect = document.getElementById('category-select');
    const newCategoryInput = document.getElementById('new-category-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const deleteCategoryBtn = document.getElementById('delete-category-btn');
    const amountInput = document.getElementById('amount-input');
    const dateInput = document.getElementById('date-input');
    const addBtn = document.getElementById('add-btn');
    const expensesTableBody = document.getElementById('expense-table-body');
    const totalAmountCell = document.getElementById('total-amount');
    const periodSelect = document.getElementById('period-select');
    const periodTotal = document.getElementById('period-total');
    const categorySummary = document.getElementById('category-summary');
    const filterCategory = document.getElementById('filter-category');
    const filterPeriod = document.getElementById('filter-period');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const searchInput = document.getElementById('search-input');
    const highestExpenseElement = document.getElementById('highest-expense');
    const lowestExpenseElement = document.getElementById('lowest-expense');
    const averageExpenseElement = document.getElementById('average-expense');
    const emptyState = document.getElementById('empty-state');

    function saveData() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    function initializeCategories() {
        categorySelect.innerHTML = '<option value="">Select a category</option>';
        filterCategory.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option.cloneNode(true));
            filterCategory.appendChild(option);
        });
    }

    function addCategory() {
        const newCategory = newCategoryInput.value.trim();
        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            initializeCategories();
            newCategoryInput.value = '';
            saveData();
        }
    }

    function deleteSelectedCategory() {
        const selectedCategory = categorySelect.value;
        if (selectedCategory && selectedCategory !== '') {
            if (confirm(`Are you sure you want to delete the category "${selectedCategory}"? This will also delete all expenses in this category.`)) {
                categories = categories.filter(category => category !== selectedCategory);
                expenses = expenses.filter(expense => expense.category !== selectedCategory);
                totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
                initializeCategories();
                renderExpenses();
                updateExpenseAnalysis();
                updateCategorySummary();
                updatePeriodTotal();
                categorySelect.value = '';
                saveData();
            }
        } else {
            alert('Please select a category to delete');
        }
    }

    function updateExpenseAnalysis() {
        if (expenses.length === 0) {
            highestExpenseElement.textContent = '$0';
            lowestExpenseElement.textContent = '$0';
            averageExpenseElement.textContent = '$0';
            return;
        }

        const amounts = expenses.map(expense => expense.amount);
        const highest = Math.max(...amounts);
        const lowest = Math.min(...amounts);
        const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;

        highestExpenseElement.textContent = `$${highest.toFixed(2)}`;
        lowestExpenseElement.textContent = `$${lowest.toFixed(2)}`;
        averageExpenseElement.textContent = `$${average.toFixed(2)}`;
    }

    function filterExpenses() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = filterCategory.value;
        const periodFilter = filterPeriod.value;
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

    function renderExpenses() {
        expensesTableBody.innerHTML = '';
        const filteredExpenses = filterExpenses();
        let filteredTotal = 0;

        if (filteredExpenses.length === 0) {
            emptyState.style.display = 'block';
            expensesTableBody.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            expensesTableBody.style.display = 'table-row-group';
        }

        filteredExpenses.forEach(expense => {
            filteredTotal += expense.amount;
            const newRow = expensesTableBody.insertRow();

            const categoryCell = newRow.insertCell();
            const amountCell = newRow.insertCell();
            const dateCell = newRow.insertCell();
            const actionCell = newRow.insertCell();

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => {
                expenses = expenses.filter(e => e !== expense);
                totalAmount -= expense.amount;
                saveData();
                renderExpenses();
                updateExpenseAnalysis();
                updateCategorySummary();
                updatePeriodTotal();
            });

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', () => {
                categorySelect.value = expense.category;
                amountInput.value = expense.amount;
                dateInput.value = expense.date;
                addBtn.textContent = 'Update';

                const newAddBtn = addBtn.cloneNode(true);
                addBtn.parentNode.replaceChild(newAddBtn, addBtn);

                newAddBtn.addEventListener('click', function updateHandler() {
                    const index = expenses.findIndex(e => e === expense);
                    if (index !== -1) {
                        expenses[index] = {
                            category: categorySelect.value,
                            amount: Number(amountInput.value),
                            date: dateInput.value
                        };
                    }

                    totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
                    saveData();
                    renderExpenses();
                    updateExpenseAnalysis();
                    updateCategorySummary();
                    updatePeriodTotal();

                    categorySelect.value = '';
                    amountInput.value = '';
                    dateInput.value = '';
                    newAddBtn.textContent = 'Add';

                    newAddBtn.removeEventListener('click', updateHandler);
                });
            });

            categoryCell.textContent = expense.category;
            amountCell.textContent = `$${expense.amount.toFixed(2)}`;
            dateCell.textContent = new Date(expense.date).toLocaleDateString();
            actionCell.appendChild(editBtn);
            actionCell.appendChild(deleteBtn);
        });

        totalAmountCell.textContent = `$${filteredTotal.toFixed(2)}`;
    }

    function updatePeriodTotal() {
        const period = periodSelect.value;
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
        periodTotal.textContent = `Total: $${total.toFixed(2)}`;
    }

    function updateCategorySummary() {
        categorySummary.innerHTML = '';
        const summary = {};

        expenses.forEach(expense => {
            summary[expense.category] = (summary[expense.category] || 0) + expense.amount;
        });

        Object.entries(summary).forEach(([category, amount]) => {
            const item = document.createElement('div');
            item.className = 'category-summary-item';
            item.innerHTML = `
                <span>${category}:</span>
                <span>$${amount.toFixed(2)}</span>
            `;
            categorySummary.appendChild(item);
        });
    }

    function resetFilters() {
        searchInput.value = '';
        filterCategory.value = '';
        filterPeriod.value = '';
        renderExpenses();
    }

    function deleteAllExpenses() {
        if (confirm('Are you sure you want to delete all expenses? This action cannot be undone.')) {
            expenses = [];
            totalAmount = 0;
            saveData();
            renderExpenses();
            updateExpenseAnalysis();
            updateCategorySummary();
            updatePeriodTotal();
        }
    }

    initializeCategories();
    renderExpenses();
    updateExpenseAnalysis();
    updateCategorySummary();
    updatePeriodTotal();

    addBtn.addEventListener('click', function() {
        const category = categorySelect.value;
        const amount = Number(amountInput.value);
        const date = dateInput.value;

        if (!category) {
            alert('Please select a category');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount');
            return;
        }
        if (!date) {
            alert('Please select a date');
            return;
        }

        expenses.push({ category, amount, date });
        totalAmount += amount;
        saveData();
        renderExpenses();
        updateExpenseAnalysis();
        updateCategorySummary();
        updatePeriodTotal();

        categorySelect.value = '';
        amountInput.value = '';
        dateInput.value = '';
    });

    addCategoryBtn.addEventListener('click', addCategory);
    deleteCategoryBtn.addEventListener('click', deleteSelectedCategory);
    periodSelect.addEventListener('change', updatePeriodTotal);
    searchInput.addEventListener('input', renderExpenses);
    filterCategory.addEventListener('change', renderExpenses);
    filterPeriod.addEventListener('change', renderExpenses);
    resetFiltersBtn.addEventListener('click', resetFilters);
    deleteAllBtn.addEventListener('click', deleteAllExpenses);
});