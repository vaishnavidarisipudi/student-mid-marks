// ============================================
// DATA STORAGE (Using localStorage for demo)
// Replace with Firebase for production
// ============================================

let currentUser = null;
let currentSemester = 1;
let currentMid = 1;
let userData = {};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// ============================================
// AUTHENTICATION
// ============================================

function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadUserData();
        showMainPage();
    }
}

function showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    hideError();
}

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    hideError();
}

function register() {
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;

    // Validation
    if (!username || !email || !password || !confirm) {
        showError('Please fill in all fields');
        return;
    }

    if (!validateEmail(email)) {
        showError('Please enter a valid email');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    if (password !== confirm) {
        showError('Passwords do not match');
        return;
    }

    // Check if user exists
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[email]) {
        showError('Email already registered');
        return;
    }

    // Create user
    users[email] = {
        username: username,
        email: email,
        password: password, // In production, hash this!
        data: initializeEmptyData()
    };

    localStorage.setItem('users', JSON.stringify(users));

    currentUser = { username, email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    userData = users[email].data;

    showMainPage();
}

function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '{}');
    const user = users[email];

    if (!user || user.password !== password) {
        showError('Invalid email or password');
        return;
    }

    currentUser = { username: user.username, email: user.email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    userData = user.data;

    showMainPage();
}

function logout() {
    currentUser = null;
    userData = {};
    localStorage.removeItem('currentUser');
    
    document.getElementById('main-page').classList.remove('active');
    document.getElementById('login-page').classList.add('active');
    
    // Clear form fields
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
}

function loadUserData() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser.email]) {
        userData = users[currentUser.email].data;
    } else {
        userData = initializeEmptyData();
    }
}

function showMainPage() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
    document.getElementById('username-display').textContent = `Welcome, ${currentUser.username}`;
    
    renderTables();
}

// ============================================
// DATA INITIALIZATION
// ============================================

function initializeEmptyData() {
    const data = {};
    for (let sem = 1; sem <= 8; sem++) {
        data[sem] = {
            mid1: createEmptyMid(),
            mid2: createEmptyMid()
        };
    }
    return data;
}

function createEmptyMid() {
    const subjects = [];
    for (let i = 0; i < 6; i++) {
        subjects.push({
            name: `Subject ${i + 1}`,
            theory: 0,
            objective: 0,
            assignment: 0
        });
    }
    return subjects;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Semester buttons
    document.querySelectorAll('.semester-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.semester-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSemester = parseInt(e.target.dataset.sem);
            updateSemesterDisplay();
            renderTables();
        });
    });

    // Mid buttons
    document.querySelectorAll('.mid-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mid-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const mid = e.target.dataset.mid;
            document.querySelectorAll('.mid-section').forEach(s => s.classList.remove('active'));
            
            if (mid === 'total') {
                document.getElementById('total-section').classList.add('active');
                renderTotalTable();
            } else {
                currentMid = parseInt(mid);
                document.getElementById(`mid${mid}-section`).classList.add('active');
            }
        });
    });
}

function updateSemesterDisplay() {
    document.querySelectorAll('.current-sem').forEach(el => {
        el.textContent = currentSemester;
    });
}

// ============================================
// TABLE RENDERING
// ============================================

function renderTables() {
    renderMidTable(1);
    renderMidTable(2);
    renderTotalTable();
    updateSemesterDisplay();
}

function renderMidTable(midNum) {
    const tbody = document.querySelector(`#mid${midNum}-table tbody`);
    const midData = userData[currentSemester]?.[`mid${midNum}`] || createEmptyMid();
    
    tbody.innerHTML = '';
    
    midData.forEach((subject, index) => {
        const total = calculateSubjectTotal(subject);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <input type="text" 
                       class="subject-input" 
                       value="${subject.name}" 
                       data-mid="${midNum}" 
                       data-row="${index}" 
                       data-field="name"
                       onchange="updateField(this)">
            </td>
            <td>
                <input type="number" 
                       min="0" max="15" 
                       value="${subject.theory}" 
                       data-mid="${midNum}" 
                       data-row="${index}" 
                       data-field="theory"
                       onchange="updateField(this)">
            </td>
            <td>
                <input type="number" 
                       min="0" max="10" 
                       value="${subject.objective}" 
                       data-mid="${midNum}" 
                       data-row="${index}" 
                       data-field="objective"
                       onchange="updateField(this)">
            </td>
            <td>
                <input type="number" 
                       min="0" max="5" 
                       value="${subject.assignment}" 
                       data-mid="${midNum}" 
                       data-row="${index}" 
                       data-field="assignment"
                       onchange="updateField(this)">
            </td>
            <td class="total-cell">${total}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderTotalTable() {
    const tbody = document.querySelector('#total-table tbody');
    const mid1Data = userData[currentSemester]?.mid1 || createEmptyMid();
    const mid2Data = userData[currentSemester]?.mid2 || createEmptyMid();
    
    tbody.innerHTML = '';
    let totalFinal = 0;
    
    for (let i = 0; i < 6; i++) {
        const mid1Total = calculateSubjectTotal(mid1Data[i]);
        const mid2Total = calculateSubjectTotal(mid2Data[i]);
        
        const maxVal = Math.max(mid1Total, mid2Total);
        const minVal = Math.min(mid1Total, mid2Total);
        const maxComponent = (maxVal * 0.8).toFixed(2);
        const minComponent = (minVal * 0.2).toFixed(2);
        const finalScore = (parseFloat(maxComponent) + parseFloat(minComponent)).toFixed(2);
        
        totalFinal += parseFloat(finalScore);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${mid1Data[i]?.name || mid2Data[i]?.name || `Subject ${i + 1}`}</td>
            <td>${mid1Total}</td>
            <td>${mid2Total}</td>
            <td>${maxComponent}</td>
            <td>${minComponent}</td>
            <td>${finalScore}</td>
        `;
        tbody.appendChild(row);
    }
    
    const avgScore = (totalFinal / 6).toFixed(2);
    document.getElementById('semester-avg').textContent = avgScore;
}

// ============================================
// DATA OPERATIONS
// ============================================

function updateField(input) {
    const mid = parseInt(input.dataset.mid);
    const row = parseInt(input.dataset.row);
    const field = input.dataset.field;
    let value = input.value;
    
    // Validate numeric fields
    if (field !== 'name') {
        value = parseFloat(value) || 0;
        
        // Enforce max values
        const maxValues = { theory: 15, objective: 10, assignment: 5 };
        if (value > maxValues[field]) {
            value = maxValues[field];
            input.value = value;
        }
        if (value < 0) {
            value = 0;
            input.value = value;
        }
    }
    
    // Initialize data structure if needed
    if (!userData[currentSemester]) {
        userData[currentSemester] = {
            mid1: createEmptyMid(),
            mid2: createEmptyMid()
        };
    }
    
    // Update data
    userData[currentSemester][`mid${mid}`][row][field] = value;
    
    // Update total cell
    const subject = userData[currentSemester][`mid${mid}`][row];
    const total = calculateSubjectTotal(subject);
    const totalCell = input.closest('tr').querySelector('.total-cell');
    if (totalCell) {
        totalCell.textContent = total;
    }
    
    // Update total table if visible
    if (document.getElementById('total-section').classList.contains('active')) {
        renderTotalTable();
    }
}

function calculateSubjectTotal(subject) {
    if (!subject) return 0;
    return (parseFloat(subject.theory) || 0) + 
           (parseFloat(subject.objective) || 0) + 
           (parseFloat(subject.assignment) || 0);
}

function saveData() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[currentUser.email]) {
        users[currentUser.email].data = userData;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Show success message
        alert('Data saved successfully!');
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}
