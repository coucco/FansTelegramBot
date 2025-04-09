const API_BASE_URL = 'https://fanstelegrambot-production.up.railway.app';

// Состояние приложения
state = {
    currentPage: 'profile',
    userData: null,
    balance: 1000
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
    await initTelegramWebApp();
    setupNavigation();
    renderPage();
});

// Инициализация Telegram WebApp
async function initTelegramWebApp() {
    try {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            
            state.userData = Telegram.WebApp.initDataUnsafe.user || {
                first_name: 'Гость',
                username: 'unknown',
                photo_url: 'assets/default-avatar.png'
            };
        } else {
            console.warn('Telegram WebApp не обнаружен');
            state.userData = {
                first_name: 'Гость (тест)',
                username: 'test_user',
                photo_url: 'assets/default-avatar.png'
            };
        }
    } catch (error) {
        console.error('Ошибка инициализации Telegram:', error);
    }
}

// Настройка навигации
function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.currentPage = btn.dataset.page;
            renderPage();
            updateActiveButton();
        });
    });
}

// Обновление активной кнопки
function updateActiveButton() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === state.currentPage);
    });
}

// Рендер текущей страницы
function renderPage() {
    const app = document.getElementById('app');
    
    switch (state.currentPage) {
        case 'profile':
            app.innerHTML = renderProfilePage();
            break;
        case 'shop':
            app.innerHTML = renderShopPage();
            break;
        case 'fans':
            app.innerHTML = renderFansPage();
            break;
        case 'rating':
            app.innerHTML = renderRatingPage();
            break;
        default:
            app.innerHTML = '<h1>Вы фанат соуса</h1>';
    }
}

// Шаблоны страниц
function renderProfilePage() {
    return `
        <div class="profile-page">
            <div class="profile-header">
                <img src="${state.userData.photo_url}" 
                     alt="Аватар" 
                     class="profile-avatar"
                     onerror="this.src='assets/default-avatar.png'">
                <div class="profile-info">
                    <h2>${state.userData.first_name}</h2>
                    <p>@${state.userData.username}</p>
                </div>
            </div>
            
            <div class="profile-balance">
                <h3>Баланс:</h3>
                <div class="balance-amount">${state.balance} лавкойнов</div>
            </div>
        </div>
    `;
}

function renderShopPage() {
    return `<div class="page"><h1>Магазин</h1><p>Плетки, Верность, Любовь</p></div>`;
}

function renderFansPage() {
    return `<div class="page"><h1>Соблазнение</h1><p>Соблазни фанатов!</p></div>`;
}

function renderRatingPage() {
    return `<div class="page"><h1>Рейтинг</h1><p>Топ самых популярных людей:</p></div>`;
}


