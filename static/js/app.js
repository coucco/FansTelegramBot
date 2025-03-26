// Основной объект приложения
const App = {
    currentUser: null,
    currentPage: 'shop',
    
    init: function() {
        // Инициализация Telegram WebApp
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
        
        // Получаем данные пользователя
        this.getUserData();
        
        // Настройка навигации
        this.setupNavigation();
        
        // Загружаем начальную страницу
        this.loadPage(this.currentPage);
    },
    
    getUserData: function() {
        const initData = Telegram.WebApp.initDataUnsafe;
        
        if (initData.user) {
            this.currentUser = {
                id: initData.user.id,
                username: initData.user.username,
                firstName: initData.user.first_name,
                lastName: initData.user.last_name,
                photoUrl: initData.user.photo_url,
                balance: 1000,
                fans: []
            };
            
            // Проверяем, есть ли пользователь в базе
            this.checkUserExists();
        } else {
            this.showError('Не удалось получить данные пользователя');
        }
    },
    
    checkUserExists: function() {
        fetch(`/api/user?id=${this.currentUser.id}`)
            .then(response => response.json())
            .then(data => {
                if (data.error && data.error === 'User not found') {
                    // Создаем нового пользователя
                    this.createUser();
                } else {
                    // Обновляем данные пользователя
                    this.currentUser.balance = data.balance;
                    this.currentUser.fans = data.fans || [];
                    
                    // Обновляем страницу, если она профиль
                    if (this.currentPage === 'profile') {
                        this.loadPage('profile');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                this.showError('Ошибка загрузки данных пользователя');
            });
    },
    
    createUser: function() {
        const userData = {
            id: this.currentUser.id,
            username: this.currentUser.username,
            first_name: this.currentUser.firstName,
            last_name: this.currentUser.lastName,
            photo_url: this.currentUser.photoUrl,
            balance: this.currentUser.balance
        };
        
        fetch('/api/user/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('User created:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
    },
    
    setupNavigation: function() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const page = button.getAttribute('data-page');
                
                // Убираем активный класс у всех кнопок
                navButtons.forEach(btn => btn.classList.remove('active'));
                
                // Добавляем активный класс текущей кнопке
                button.classList.add('active');
                
                // Загружаем страницу
                this.loadPage(page);
            });
        });
    },
    
    loadPage: function(page) {
        this.currentPage = page;
        const content = document.getElementById('content');
        
        // Показываем загрузку
        content.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i></div>';
        
        switch(page) {
            case 'shop':
                this.loadShopPage();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
            case 'search':
                this.loadSearchPage();
                break;
            case 'leaderboard':
                this.loadLeaderboardPage();
                break;
            default:
                this.loadShopPage();
        }
    },
    
    loadShopPage: function() {
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                let html = '<h1 class="page-title">Магазин</h1>';
                
                if (products.length > 0) {
                    html += '<div class="products-grid">';
                    
                    products.forEach(product => {
                        html += `
                            <div class="product-card">
                                <img src="${product.image_url}" alt="${product.name}" class="product-image">
                                <div class="product-name">${product.name}</div>
                                <div class="product-price">${product.price} монет</div>
                                <div class="product-description">${product.description}</div>
                                <button class="buy-btn" data-id="${product.id}" data-price="${product.price}">Купить</button>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                } else {
                    html += '<p>Нет доступных товаров</p>';
                }
                
                document.getElementById('content').innerHTML = html;
                
                // Назначаем обработчики для кнопок покупки
                document.querySelectorAll('.buy-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const productId = button.getAttribute('data-id');
                        const productPrice = parseInt(button.getAttribute('data-price'));
                        
                        this.buyProduct(productId, productPrice);
                    });
                });
            })
            .catch(error => {
                console.error('Error:', error);
                this.showError('Ошибка загрузки товаров');
            });
    },
    
    buyProduct: function(productId, price) {
        if (!this.currentUser) {
            this.showError('Пользователь не авторизован');
            return;
        }
        
        if (this.currentUser.balance < price) {
            this.showError('Недостаточно средств');
            return;
        }
        
        fetch('/api/products/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: this.currentUser.id,
                product_id: productId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.currentUser.balance = data.new_balance;
                
                // Обновляем баланс в интерфейсе
                if (this.currentPage === 'profile') {
                    document.querySelector('.balance').textContent = `${data.new_balance} монет`;
                }
                
                // Показываем уведомление
                alert('Покупка совершена успешно!');
            } else {
                this.showError(data.error || 'Ошибка при покупке');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showError('Ошибка при покупке');
        });
    },
    
    loadProfilePage: function() {
        if (!this.currentUser) {
            this.showError('Пользователь не авторизован');
            return;
        }
        
        fetch(`/api/user?id=${this.currentUser.id}`)
            .then(response => response.json())
            .then(data => {
                let html = `
                    <div class="profile-header">
                        <img src="${data.photo_url || '/static/images/default_avatar.png'}" alt="Аватар" class="profile-avatar">
                        <div class="profile-info">
                            <h2>${data.first_name} ${data.last_name}</h2>
                            <p>@${data.username}</p>
                        </div>
                    </div>
                    <div class="balance">${data.balance} монет</div>
                    <h2 class="page-title">Мои фанаты</h2>
                `;
                
                if (data.fans && data.fans.length > 0) {
                    html += '<div class="fans-grid">';
                    
                    data.fans.forEach(fan => {
                        html += `
                            <div class="fan-card">
                                <img src="${fan.photo_url || '/static/images/default_fan.png'}" alt="${fan.name}" class="fan-image">
                                <div class="fan-name">${fan.name}</div>
                                <div class="fan-income">+${fan.income} монет/час</div>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                } else {
                    html += '<p>У вас пока нет фанатов</p>';
                }
                
                document.getElementById('content').innerHTML = html;
            })
            .catch(error => {
                console.error('Error:', error);
                this.showError('Ошибка загрузки профиля');
            });
    },
    
    loadSearchPage: function() {
        fetch('/api/fans/available')
            .then(response => response.json())
            .then(fans => {
                let html = '<h1 class="page-title">Поиск фанатов</h1>';
                
                if (fans.length > 0) {
                    html += '<div class="search-list">';
                    
                    fans.forEach(fan => {
                        html += `
                            <div class="search-item">
                                <div class="search-item-info">
                                    <img src="${fan.photo_url || '/static/images/default_fan.png'}" alt="${fan.name}" class="search-item-avatar">
                                    <div>
                                        <div class="search-item-name">${fan.name}</div>
                                        <div class="search-item-price">${fan.price} монет</div>
                                    </div>
                                </div>
                                <button class="search-buy-btn" data-id="${fan.id}" data-price="${fan.price}">Купить</button>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                } else {
                    html += '<p>Нет доступных фанатов</p>';
                }
                
                document.getElementById('content').innerHTML = html;
                
                // Назначаем обработчики для кнопок покупки
                document.querySelectorAll('.search-buy-btn').forEach(button => {
                    button.addEventListener('click', () => {
                        const fanId = button.getAttribute('data-id');
                        const fanPrice = parseInt(button.getAttribute('data-price'));
                        
                        this.buyFan(fanId, fanPrice);
                    });
                });
            })
            .catch(error => {
                console.error('Error:', error);
                this.showError('Ошибка загрузки списка фанатов');
            });
    },
    
    buyFan: function(fanId, price) {
        if (!this.currentUser) {
            this.showError('Пользователь не авторизован');
            return;
        }
        
        if (this.currentUser.balance < price) {
            this.showError('Недостаточно средств');
            return;
        }
        
        fetch('/api/fans/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: this.currentUser.id,
                fan_id: fanId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                this.currentUser.balance = data.new_balance;
                
                // Обновляем данные пользователя
                this.currentUser.fans.push({
                    id: fanId,
                    price: data.fan.price,
                    income: data.fan.income
                });
                
                // Обновляем страницу профиля, если она активна
                if (this.currentPage === 'profile') {
                    this.loadProfilePage();
                }
                
                // Обновляем страницу поиска
                if (this.currentPage === 'search') {
                    this.loadSearchPage();
                }
                
                // Показываем уведомление
                alert('Фан успешно куплен!');
            } else {
                this.showError(data.error || 'Ошибка при покупке фаната');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showError('Ошибка при покупке фаната');
        });
    },
    
    loadLeaderboardPage: function() {
        fetch('/api/leaderboard')
            .then(response => response.json())
            .then(leaders => {
                let html = '<h1 class="page-title">Рейтинг игроков</h1>';
                
                if (leaders.length > 0) {
                    html += '<div class="leaderboard-list">';
                    
                    leaders.forEach((leader, index) => {
                        const isCurrentUser = this.currentUser && leader.id === this.currentUser.id;
                        const userClass = isCurrentUser ? 'current-user' : '';
                        
                        html += `
                            <div class="leaderboard-item ${userClass}">
                                <div class="leaderboard-position">${index + 1}</div>
                                <img src="${leader.photo_url || '/static/images/default_avatar.png'}" alt="${leader.first_name}" class="leaderboard-avatar">
                                <div class="leaderboard-info">
                                    <div class="leaderboard-name">${leader.first_name} ${leader.last_name}</div>
                                    <div class="leaderboard-username">@${leader.username}</div>
                                </div>
                                <div class="leaderboard-balance">${leader.balance} монет</div>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                } else {
                    html += '<p>Рейтинг пуст</p>';
                }
                
                document.getElementById('content').innerHTML = html;
            })
            .catch(error => {
                console.error('Error:', error);
                this.showError('Ошибка загрузки рейтинга');
            });
    },
    
    showError: function(message) {
        document.getElementById('content').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
};

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
