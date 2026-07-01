// public/js/modules/excel.js
import { apiFetchBlob } from './api.js';

export async function exportExcel(endpoint, filename = 'export.xlsx') {
  try {
    const blob = await apiFetchBlob(`/${endpoint}/export`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Ошибка экспорта:', err);
    throw err;
  }
}

export function importExcel(endpoint, fileInputId, callback) {
  const input = document.getElementById(fileInputId);
  if (!input) return;
  
  input.click();
  
  input.onchange = async function() {
    if (!this.files || !this.files[0]) return;
    
    const formData = new FormData();
    formData.append('file', this.files[0]);
    
    try {
      const response = await fetch(`/api/${endpoint}/import`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Ошибка импорта' }));
        throw new Error(error.message || 'Ошибка импорта');
      }
      
      this.value = '';
      if (callback) callback();
    } catch (err) {
      alert('Ошибка импорта: ' + err.message);
    }
  };
}
