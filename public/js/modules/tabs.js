// public/js/modules/tabs.js
export function initTabs(container, tabConfig) {
  const loaded = {};
  let isLoading = false;
  
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      // Защита от повторных кликов
      if (isLoading) return;
      
      // Переключение вкладок
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      
      const tabId = this.dataset.tab;
      const target = document.getElementById(`tab-${tabId}`);
      if (target) target.classList.add('active');
      
      // Загрузка данных только один раз
      const loader = tabConfig[tabId];
      if (loader && !loaded[tabId]) {
        isLoading = true;
        try {
          await loader();
          loaded[tabId] = true;
        } catch (err) {
          console.error(`Ошибка загрузки вкладки ${tabId}:`, err);
        } finally {
          isLoading = false;
        }
      }
    });
  });
}

export function resetTabs(container) {
  container.querySelectorAll('.tab-btn').forEach((btn, index) => {
    if (index === 0) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  container.querySelectorAll('.tab-content').forEach((content, index) => {
    if (index === 0) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}
