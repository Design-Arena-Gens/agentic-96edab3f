// Global Variables
let currentSort = { column: 'rank', ascending: true };
let currentFilter = 'all';
let filteredData = [...modelsData];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    populateLeaderboard();
    populateCompareSelects();
    setupEventListeners();
    initializeCharts();
    updateStats();
});

// ============================================
// Theme Management
// ============================================
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Search
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => handleFilter(e.target.dataset.filter));
    });

    // Table sorting
    document.querySelectorAll('.leaderboard-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => handleSort(th.dataset.sort));
    });

    // Compare button
    document.getElementById('compareBtn').addEventListener('click', handleCompare);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ============================================
// Leaderboard Functions
// ============================================
function populateLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    filteredData.forEach((model, index) => {
        const row = createTableRow(model, index);
        tbody.appendChild(row);

        // Animate entry
        setTimeout(() => {
            row.classList.add('animate-in');
        }, index * 30);
    });
}

function createTableRow(model, index) {
    const row = document.createElement('tr');
    row.style.opacity = '0';

    const rankClass = model.rank === 1 ? 'top-1' : model.rank === 2 ? 'top-2' : model.rank === 3 ? 'top-3' : '';

    row.innerHTML = `
        <td><span class="rank ${rankClass}">${model.rank}</span></td>
        <td>
            <div class="model-info">
                <img src="${model.logo}" alt="${model.company}" class="model-logo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22%23667eea%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22>${model.company[0]}</text></svg>'">
                <div>
                    <div class="model-name">${model.name}</div>
                    <div class="model-company">${model.company}</div>
                </div>
            </div>
        </td>
        <td><span class="score">${model.overall > 0 ? model.overall.toFixed(1) : 'TBA'}</span></td>
        <td>${createScoreBar(model.mmlu)}</td>
        <td>${createScoreBar(model.humaneval)}</td>
        <td>${createScoreBar(model.gsm8k)}</td>
        <td>${createScoreBar(model.hellaswag)}</td>
        <td>${createScoreBar(model.truthful)}</td>
        <td>${formatDate(model.updated)}</td>
        <td><span class="status-badge status-${model.status}">${getStatusText(model.status)}</span></td>
    `;

    return row;
}

function createScoreBar(score) {
    if (score === 0) return '<div class="score-bar"><span>TBA</span></div>';

    return `
        <div class="score-bar">
            <span class="score">${score.toFixed(1)}</span>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${score}%"></div>
            </div>
        </div>
    `;
}

function getStatusText(status) {
    const statusMap = {
        'available': 'متاح',
        'beta': 'تجريبي',
        'soon': 'قريباً'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'اليوم';
    if (diffDays === 1) return 'أمس';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;

    return date.toLocaleDateString('ar-SA');
}

// ============================================
// Search & Filter Functions
// ============================================
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredData = modelsData.filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchTerm) ||
                            model.company.toLowerCase().includes(searchTerm);
        const matchesFilter = currentFilter === 'all' || model.status === currentFilter;
        return matchesSearch && matchesFilter;
    });
    populateLeaderboard();
}

function handleFilter(filter) {
    currentFilter = filter;

    // Update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    // Filter data
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    filteredData = modelsData.filter(model => {
        const matchesSearch = !searchTerm ||
                            model.name.toLowerCase().includes(searchTerm) ||
                            model.company.toLowerCase().includes(searchTerm);
        const matchesFilter = filter === 'all' || model.status === filter;
        return matchesSearch && matchesFilter;
    });

    populateLeaderboard();
}

// ============================================
// Sorting Functions
// ============================================
function handleSort(column) {
    if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
    } else {
        currentSort.column = column;
        currentSort.ascending = false;
    }

    filteredData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];

        // Handle date sorting
        if (column === 'updated') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        }

        // Handle string sorting
        if (typeof aVal === 'string') {
            return currentSort.ascending ?
                aVal.localeCompare(bVal) :
                bVal.localeCompare(aVal);
        }

        // Handle number sorting
        return currentSort.ascending ? aVal - bVal : bVal - aVal;
    });

    populateLeaderboard();
}

// ============================================
// Compare Functions
// ============================================
function populateCompareSelects() {
    const select1 = document.getElementById('compareModel1');
    const select2 = document.getElementById('compareModel2');

    modelsData.forEach(model => {
        if (model.overall > 0) {
            const option1 = new Option(`${model.name} (${model.company})`, model.name);
            const option2 = new Option(`${model.name} (${model.company})`, model.name);
            select1.add(option1);
            select2.add(option2);
        }
    });
}

let comparisonChart = null;

function handleCompare() {
    const model1Name = document.getElementById('compareModel1').value;
    const model2Name = document.getElementById('compareModel2').value;

    if (!model1Name || !model2Name) {
        alert('الرجاء اختيار نموذجين للمقارنة');
        return;
    }

    if (model1Name === model2Name) {
        alert('الرجاء اختيار نموذجين مختلفين');
        return;
    }

    const model1 = modelsData.find(m => m.name === model1Name);
    const model2 = modelsData.find(m => m.name === model2Name);

    const resultDiv = document.getElementById('comparisonResult');
    resultDiv.style.display = 'block';

    // Destroy previous chart if exists
    if (comparisonChart) {
        comparisonChart.destroy();
    }

    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const theme = document.documentElement.getAttribute('data-theme');
    const textColor = theme === 'dark' ? '#f8f9fa' : '#1a1a1a';

    comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['MMLU', 'HumanEval', 'GSM8K', 'HellaSwag', 'TruthfulQA'],
            datasets: [
                {
                    label: model1.name,
                    data: [model1.mmlu, model1.humaneval, model1.gsm8k, model1.hellaswag, model1.truthful],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)'
                },
                {
                    label: model2.name,
                    data: [model2.mmlu, model2.humaneval, model2.gsm8k, model2.hellaswag, model2.truthful],
                    backgroundColor: 'rgba(118, 75, 162, 0.2)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(118, 75, 162, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: textColor,
                        stepSize: 20
                    },
                    grid: {
                        color: theme === 'dark' ? '#495057' : '#dee2e6'
                    },
                    pointLabels: {
                        color: textColor,
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor,
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });

    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// Statistics Functions
// ============================================
let overallChart = null;
let benchmarkChart = null;

function initializeCharts() {
    createOverallDistribution();
    createBenchmarkAverages();
}

function createOverallDistribution() {
    const ctx = document.getElementById('overallDistribution').getContext('2d');
    const theme = document.documentElement.getAttribute('data-theme');
    const textColor = theme === 'dark' ? '#f8f9fa' : '#1a1a1a';

    const availableModels = modelsData.filter(m => m.overall > 0);
    const ranges = [
        { label: '0-20', min: 0, max: 20 },
        { label: '20-40', min: 20, max: 40 },
        { label: '40-60', min: 40, max: 60 },
        { label: '60-80', min: 60, max: 80 },
        { label: '80-100', min: 80, max: 100 }
    ];

    const counts = ranges.map(range =>
        availableModels.filter(m => m.overall >= range.min && m.overall < range.max).length
    );

    if (overallChart) {
        overallChart.destroy();
    }

    overallChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges.map(r => r.label),
            datasets: [{
                label: 'عدد النماذج',
                data: counts,
                backgroundColor: 'rgba(102, 126, 234, 0.7)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        stepSize: 1
                    },
                    grid: {
                        color: theme === 'dark' ? '#495057' : '#dee2e6'
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: theme === 'dark' ? '#495057' : '#dee2e6'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

function createBenchmarkAverages() {
    const ctx = document.getElementById('benchmarkAverages').getContext('2d');
    const theme = document.documentElement.getAttribute('data-theme');
    const textColor = theme === 'dark' ? '#f8f9fa' : '#1a1a1a';

    const availableModels = modelsData.filter(m => m.overall > 0);

    const averages = {
        mmlu: average(availableModels.map(m => m.mmlu)),
        humaneval: average(availableModels.map(m => m.humaneval)),
        gsm8k: average(availableModels.map(m => m.gsm8k)),
        hellaswag: average(availableModels.map(m => m.hellaswag)),
        truthful: average(availableModels.map(m => m.truthful))
    };

    if (benchmarkChart) {
        benchmarkChart.destroy();
    }

    benchmarkChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['MMLU', 'HumanEval', 'GSM8K', 'HellaSwag', 'TruthfulQA'],
            datasets: [{
                label: 'المتوسط',
                data: Object.values(averages),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: theme === 'dark' ? '#495057' : '#dee2e6'
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: theme === 'dark' ? '#495057' : '#dee2e6'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// ============================================
// Utility Functions
// ============================================
function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function updateStats() {
    const availableModels = modelsData.filter(m => m.overall > 0).length;
    document.getElementById('totalModels').textContent = availableModels;
    document.getElementById('totalBenchmarks').textContent = '5';
    document.getElementById('lastUpdate').textContent = 'اليوم';
    document.getElementById('aboutLastUpdate').textContent = new Date().toLocaleDateString('ar-SA');
}

// Re-initialize charts on theme change
const originalToggleTheme = toggleTheme;
toggleTheme = function() {
    originalToggleTheme();
    setTimeout(() => {
        initializeCharts();
        if (comparisonChart) {
            const model1Name = document.getElementById('compareModel1').value;
            const model2Name = document.getElementById('compareModel2').value;
            if (model1Name && model2Name) {
                handleCompare();
            }
        }
    }, 100);
};
