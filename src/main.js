/**ПРЕМИЯ
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    switch (index) {
        case 0: return profit*0.15; break;
        case 1: return profit*0.10; break;
        case 2: return profit*0.10; break;
        case total-1: return 0; break;
        default: return profit*0.05; 
    }
}


/**ВЫРУЧКА
 * Функция для расчета выручки 
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;
   return quantity*sale_price*(1-discount/100)
}


/**ГЛАВНАЯ
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    const { calculateRevenue, calculateBonus } = options;

    if (!data
        || !Array.isArray(data.sellers)
        || !Array.isArray(data.products)
        || !Array.isArray(data.purchase_records)
        || data.sellers.length === 0
        || data.products.length === 0
        || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные (не массив или нулевая длина)');
    }

    // @TODO: Проверка наличия опций
    if (!typeof options === "object") {
        throw new Error('Некорректные опции (опции не объект)');
    }

    if (!calculateRevenue || !calculateBonus) {
        throw new Error('В оциях не хватает функции');
    }

    if (!typeof calculateRevenue === "function" 
        || !typeof calculateBonus === "function") {
        throw new Error('В опциях передана не функция');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    })); 
    
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    // т.е. перебрать чеки и наполнить объект статистики: id продавца, имя, выручка, прибыль, число продаж, кол-во проданных sku
    data.purchase_records.forEach(record => { // Чек 
        // Получаем ссылку на объект родавца в массиве
        const seller = sellerIndex[record.seller_id]; 
        // Увеличить количество продаж 
        seller.sales_count += 1
        // Увеличить общую сумму всех продаж
        seller.revenue += record.total_amount
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            // Получаем ссылку на объект товара в массиве
            const product = productIndex[item.sku]; 
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const coast = product.purchase_price*item.quantity
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateRevenue(item, product)
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - coast
            // Увеличить общую накопленную прибыль (profit) у продавца 
            seller.profit += profit
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit); 

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        // Считаем бонус
        seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller) 
        // Формируем топ-10 товаров
        seller.top_products = Object.entries(
            seller.products_sold
        ).map(
            ([sku, quantity])=>({sku: sku, quantity:quantity})
        ).sort(
            (a, b) => b.quantity - a.quantity
        ).slice(0, 10) 
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,// Строка, идентификатор продавца
        name: seller.name, // Строка, имя продавца
        revenue: +seller.revenue.toFixed(2), // Число с двумя знаками после точки, выручка продавца
        profit: +seller.profit.toFixed(2), // Число с двумя знаками после точки, прибыль продавца
        sales_count: seller.sales_count, // Целое число, количество продаж продавца
        top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
        bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
    }));
}