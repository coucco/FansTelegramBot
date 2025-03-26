// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Раскрываем на весь экран

// Данные пользователя
const user = {
    id: tg.initDataUnsafe.user?.id,
    name: tg.initDataUnsafe.user?.first_name,
    avatar: tg.initDataUnsafe.user?.photo_url,
    balance: 1000, // Пример баланса
    fans: []       // Массив фанатов
};

// Заполняем профиль
document.getElementById('user-name').textContent = user.name;
document.getElementById('user-avatar').src = user.avatar;
document.getElementById('user-balance').textContent = user.balance;

// Переключение страниц
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.page.active').classList.remove('active');
        document.getElementById(btn.dataset.page).classList.add('active');
        
        document.querySelector('.nav-btn.active').classList.remove('active');
        btn.classList.add('active');
    });
});

// Загрузка товаров (пример)
const shopItems = [
    { id: 1, name: "Футболка", price: 200, image: "https://via.placeholder.com/100" },
    { id: 2, name: "Шляпа", price: 150, image: "https://via.placeholder.com/100" },
    { id: 3, name: "Кружка", price: 100, image: "https://via.placeholder.com/100" },
];

const shopGrid = document.getElementById('shop-items');
shopItems.forEach(item => {
    shopGrid.innerHTML += `
        <div class="item-card">
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.price} монет</p>
            <button class="buy-btn" data-id="${item.id}">Купить</button>
        </div>
    `;
});

// Обработка покупки
document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const itemId = btn.dataset.id;
        const item = shopItems.find(x => x.id == itemId);
        
        if (user.balance >= item.price) {
            user.balance -= item.price;
            document.getElementById('user-balance').textContent = user.balance;
            alert(`Вы купили ${item.name}!`);
        } else {
            alert("Недостаточно монет!");
        }
    });
});
