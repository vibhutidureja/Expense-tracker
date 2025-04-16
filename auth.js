// User authentication class
class Auth {
    constructor() {
        this.currentUser = null;
        this.initializeUsers();
    }

    initializeUsers() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
    }

    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    }

    register(username, email, password) {
        const users = this.getUsers();
        
        // Check if username already exists
        if (users.some(user => user.username === username)) {
            throw new Error('Username already exists');
        }

        // Add new user
        users.push({
            username,
            email,
            password: this.hashPassword(password)
        });

        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }

    login(username, password) {
        const users = this.getUsers();
        const user = users.find(user => user.username === username);
        
        if (!user) {
            return false;
        }

        const isPasswordValid = this.verifyPassword(password, user.password);
        if (isPasswordValid) {
            this.currentUser = username;
            localStorage.setItem('currentUser', username);
            return true;
        }
        return false;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    hashPassword(password) {
        // In a real application, use a proper hashing algorithm like bcrypt
        return btoa(password);
    }

    verifyPassword(password, hash) {
        return btoa(password) === hash;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

// Initialize auth instance
const auth = new Auth();

// Handle login form submission
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const success = auth.login(username, password);
        if (success) {
            window.location.href = 'index.html';
        } else {
            showError('Invalid username or password');
        }
    } catch (error) {
        showError(error.message);
    }
});

// Handle register form submission
document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        auth.register(username, email, password);
        showSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } catch (error) {
        showError(error.message);
    }
});

function showError(message) {
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        document.querySelector('form').appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

function showSuccess(message) {
    let successDiv = document.querySelector('.success-message');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        document.querySelector('form').appendChild(successDiv);
    }
    successDiv.textContent = message;
}

// Check authentication on main page
if (window.location.pathname.includes('index.html')) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html';
    } else {
        auth.currentUser = currentUser;
    }
} 