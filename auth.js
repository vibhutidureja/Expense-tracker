class Auth {
    constructor() {
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
        
        if (users.some(user => user.username === username)) {
            throw new Error('Username already exists');
        }

        users.push({ username, email, password: btoa(password) });
        localStorage.setItem('users', JSON.stringify(users));
        return true;
    }

    login(username, password) {
        const users = this.getUsers();
        const user = users.find(user => user.username === username);
        
        if (!user || btoa(password) !== user.password) {
            return false;
        }

        localStorage.setItem('currentUser', username);
        return true;
    }

    logout() {
        localStorage.removeItem('currentUser');
    }
}

// Initialize auth
const auth = new Auth();

// Handle login form
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (auth.login(username, password)) {
        window.location.href = 'index.html';
    } else {
        showMessage('Invalid username or password', 'error');
    }
});

// Handle register form
document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    try {
        auth.register(username, email, password);
        showMessage('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => window.location.href = 'login.html', 1500);
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Show messages
function showMessage(message, type) {
    const div = document.createElement('div');
    div.className = `${type}-message`;
    div.textContent = message;
    
    const form = document.querySelector('form');
    const existingMessage = form.querySelector(`.${type}-message`);
    if (existingMessage) {
        existingMessage.remove();
    }
    
    form.appendChild(div);
}

// Check authentication
if (window.location.pathname.includes('index.html') && !localStorage.getItem('currentUser')) {
    window.location.href = 'login.html';
} 