// Инициализация Telegram WebApp
const tgWebApp = window.Telegram.WebApp;
tgWebApp.expand(); // Раскрываем приложение на весь экран

// Элементы DOM
const pageContent = document.getElementById('page-content');
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// Инициализация страниц
function initPages() {
  // Показываем только активную страницу
  pages.forEach(page => {
    if (page.classList.contains('active')) {
      page.style.display = 'block';
    } else {
      page.style.display = 'none';
    }
  });
  
  // Загрузка данных для страниц
  loadHomePage();
  loadCatalogPage();
  loadCartPage();
  loadProfilePage();
}

// Обработчик навигации
function setupNavigation() {
  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const pageId = button.getAttribute('data-page');
      
      // Убираем активный класс у всех кнопок и страниц
      navButtons.forEach(btn => btn.classList.remove('active'));
      pages.forEach(page => page.classList.remove('active'));
      
      // Добавляем активный класс к выбранной кнопке и странице
      button.classList.add('active');
      document.getElementById(pageId).classList.add('active');
      
      // Прокручиваем вверх при переключении страниц
      pageContent.scrollTo(0, 0);
    });
  });
}

// Загрузка данных для страниц
function loadHomePage() {
  // Здесь можно загружать данные для главной страницы
  console.log('Загрузка данных для главной страницы');
}

function loadCatalogPage() {
  const productGrid = document.querySelector('.product-grid');
  
  // Пример товаров (в реальном приложении данные будут приходить с сервера)
  const products = [
    { id: 1, name: 'Товар 1', price: 100 },
    { id: 2, name: 'Товар 2', price: 200 },
    { id: 3, name: 'Товар 3', price: 300 },
    { id: 4, name: 'Товар 4', price: 400 },
  ];
  
  // Очищаем сетку
  productGrid.innerHTML = '';
  
  // Добавляем товары
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <h3>${product.name}</h3>
      <p>Цена: ${product.price} ₽</p>
      <button class="add-to-cart" data-id="${product.id}">В корзину</button>
    `;
    productGrid.appendChild(productCard);
  });
}

function loadCartPage() {
  // Здесь можно загружать данные корзины
  console.log('Загрузка данных корзины');
}

function loadProfilePage() {
  // Если пользователь авторизован, показываем его данные
  if (tgWebApp.initDataUnsafe.user) {
    const user = tgWebApp.initDataUnsafe.user;
    const userInfo = document.querySelector('.user-info');
    
    userInfo.innerHTML = `
      <div class="profile-header">
        <h2>${user.first_name} ${user.last_name || ''}</h2>
        <p>@${user.username || 'без username'}</p>
      </div>
      <button id="logout-btn">Выйти</button>
    `;
  }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  initPages();
  setupNavigation();
  
  // Можно добавить обработчик для кнопки закрытия
  tgWebApp.BackButton.show();
  tgWebApp.BackButton.onClick(() => {
    tgWebApp.close();
  });
});
