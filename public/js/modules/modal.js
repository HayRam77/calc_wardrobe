// public/js/modules/modal.js
export function createModal(options = {}) {
  const {
    title = 'Модальное окно',
    content = '',
    width = '500px',
    onClose = null,
    onSave = null
  } = options;
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.cssText = 'display:flex;z-index:3000;';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width:${width};max-height:90vh;overflow-y:auto;">
      <span class="modal-close">&times;</span>
      <h3>${escapeHtml(title)}</h3>
      <form id="modalForm">
        ${content}
        <div class="form-actions">
          <button type="button" class="btn btn-secondary cancel-btn">Отмена</button>
          <button type="submit" class="btn btn-primary">Сохранить</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const close = () => {
    modal.remove();
    if (onClose) onClose();
  };
  
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.querySelector('.cancel-btn').addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  
  if (onSave) {
    modal.querySelector('#modalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      onSave(modal);
    });
  }
  
  return modal;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
