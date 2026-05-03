export const apiFetch = (url, options = {}, deviceId) => {
  return fetch(url, { 
    ...options, 
    headers: { 
      'Content-Type': 'application/json',
      'X-User-Id': deviceId,
      ...options.headers
    } 
  });
};

export const mmToCm = (mm) => (parseFloat(mm) / 10).toFixed(2);
export const cmToMm = (cm) => (parseFloat(cm) * 10).toFixed(2);
