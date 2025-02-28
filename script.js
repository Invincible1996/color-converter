document.addEventListener('DOMContentLoaded', function() {
  // Color picker elements
  const hueSlider = document.getElementById('hueSlider');
  const colorSquare = document.getElementById('colorSquare');
  const huePointer = document.getElementById('huePointer');
  const squarePointer = document.getElementById('squarePointer');
  const colorPreview = document.getElementById('colorPreview');
  const opacitySlider = document.getElementById('opacitySlider');

  // Input fields
  const hexInput = document.getElementById('hexInput');
  const rgbaInput = document.getElementById('rgbaInput');
  const hslInput = document.getElementById('hslInput');
  const hsvInput = document.getElementById('hsvInput');
  const cmykInput = document.getElementById('cmykInput');

  // Convert buttons
  const convertButtons = document.querySelectorAll('.convert-btn');
  
  // Color history elements
  const colorHistoryContainer = document.createElement('div');
  colorHistoryContainer.id = 'colorHistory';
  colorHistoryContainer.className = 'color-history-container';
  
  // 修复：检查是否存在.color-converter元素，如果不存在则附加到body
  const colorConverter = document.querySelector('.color-converter');
  if (colorConverter) {
    colorConverter.appendChild(colorHistoryContainer);
  } else {
    // 查找更可能存在的父容器，或者创建一个
    const container = document.querySelector('.container') || document.querySelector('main') || document.body;
    container.appendChild(colorHistoryContainer);
  }
  
  const historyTitle = document.createElement('h3');
  historyTitle.textContent = '颜色历史记录';
  colorHistoryContainer.appendChild(historyTitle);
  
  const historySwatches = document.createElement('div');
  historySwatches.id = 'historySwatches';
  historySwatches.className = 'color-history-swatches';
  colorHistoryContainer.appendChild(historySwatches);

  // Color history tracking
  let colorHistory = [];
  const maxHistoryItems = 16; // Maximum number of history items

  // Current color state
  let currentColor = {
    h: 216,   // Hue: 0-360
    s: 100,   // Saturation: 0-100
    v: 100,   // Value: 0-100
    a: 1.0    // Alpha: 0-1
  };

  // 添加变量来跟踪HEX格式和输入错误状态
  let hexFormat = 'long'; // 'short' 表示3位格式，'long' 表示6位格式
  let hexInputError = false;

  // Initialize color picker
  initColorPicker();

  function initColorPicker() {
    // Set initial positions for pointers
    updateHueSliderBackground();
    updateColorSquareBackground();
    updateColorFromHsv();
    updateAllInputs();
    
    // Position pointers initially
    positionHuePointer();
    positionSquarePointer();
    
    // Set up event listeners
    setupEventListeners();
  }

  function setupEventListeners() {
    // Hue slider events
    hueSlider.addEventListener('mousedown', startHueDrag);
    
    // Color square events
    colorSquare.addEventListener('mousedown', startSquareDrag);
    
    // Opacity slider event
    opacitySlider.addEventListener('input', handleOpacityChange);
    
    // 修改按钮事件 - 改为复制功能
    convertButtons.forEach(btn => {
      // 更新按钮文本为"复制"
      if (btn.textContent.includes('应用') || btn.textContent.includes('Apply')) {
        btn.textContent = btn.textContent.replace('应用', '复制').replace('Apply', 'Copy');
      }
      
      // 更改点击事件为复制功能
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        copyColorValue(type, btn);
      });
    });

    // 修改hex输入框的事件监听
    hexInput.addEventListener('input', debounce(() => {
      // 检测输入的HEX格式
      const hex = hexInput.value.trim();
      const hexValue = hex.replace(/^#/, '');

      // 验证HEX格式
      if (isValidHexFormat(hexValue)) {
        removeHexInputError();
        if (hexValue.length === 3 || hexValue.length === 4) {
          hexFormat = 'short';
        } else {
          hexFormat = 'long';
        }
        applyColorFromInput('hex');
      } else {
        showHexInputError();
      }
    }, 300));
    rgbaInput.addEventListener('input', debounce(() => applyColorFromInput('rgba'), 300));
    hslInput.addEventListener('input', debounce(() => applyColorFromInput('hsl'), 300));
    hsvInput.addEventListener('input', debounce(() => applyColorFromInput('hsv'), 300));
    cmykInput.addEventListener('input', debounce(() => applyColorFromInput('cmyk'), 300));
  }

  // 添加防抖函数，避免频繁更新
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }

  // 验证HEX格式是否正确
  function isValidHexFormat(hex) {
    // 验证长度是否为3、4、6或8位
    if (![3, 4, 6, 8].includes(hex.length)) {
      return false;
    }
    
    // 验证是否只包含有效的十六进制字符
    return /^[0-9A-Fa-f]+$/.test(hex);
  }

  // 显示HEX输入错误
  function showHexInputError() {
    hexInput.classList.add('input-error');
    hexInputError = true;
    
    // 如果页面中没有错误提示元素，则创建一个
    let errorMsgEl = document.getElementById('hexInputError');
    if (!errorMsgEl) {
      errorMsgEl = document.createElement('div');
      errorMsgEl.id = 'hexInputError';
      errorMsgEl.className = 'error-message';
      errorMsgEl.textContent = '无效的十六进制颜色格式！请使用 3位(#RGB)、4位(#RGBA)、6位(#RRGGBB) 或 8位(#RRGGBBAA) 格式。';
      
      // 将错误提示插入到控制行的最后，使其出现在输入框下方
      const controlRow = hexInput.closest('.control-row');
      controlRow.appendChild(errorMsgEl);
    }
  }

  // 移除HEX输入错误
  function removeHexInputError() {
    if (hexInputError) {
      hexInput.classList.remove('input-error');
      hexInputError = false;
      
      // 移除错误提示
      const errorMsgEl = document.getElementById('hexInputError');
      if (errorMsgEl) {
        errorMsgEl.remove();
      }
    }
  }

  // Hue slider interaction
  function startHueDrag(e) {
    handleHueDrag(e);
    window.addEventListener('mousemove', handleHueDrag);
    window.addEventListener('mouseup', stopHueDrag);
  }

  function handleHueDrag(e) {
    e.preventDefault();
    const rect = hueSlider.getBoundingClientRect();
    let x = e.clientX - rect.left;
    
    // Constrain x to the slider bounds
    x = Math.max(0, Math.min(x, rect.width));
    
    // Convert position to hue (0-360)
    currentColor.h = (x / rect.width) * 360;
    
    // Update UI
    positionHuePointer();
    updateColorSquareBackground();
    updateColorFromHsv();
    updateAllInputs();
  }

  function stopHueDrag() {
    window.removeEventListener('mousemove', handleHueDrag);
    window.removeEventListener('mouseup', stopHueDrag);
  }

  function positionHuePointer() {
    const percent = currentColor.h / 360;
    huePointer.style.left = `${percent * 100}%`;
  }

  // Color square interaction
  function startSquareDrag(e) {
    handleSquareDrag(e);
    window.addEventListener('mousemove', handleSquareDrag);
    window.addEventListener('mouseup', stopSquareDrag);
  }

  function handleSquareDrag(e) {
    e.preventDefault();
    const rect = colorSquare.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Constrain to square bounds
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    
    // Convert position to saturation and value (0-100)
    currentColor.s = (x / rect.width) * 100;
    currentColor.v = 100 - (y / rect.height) * 100; // Invert Y axis
    
    // Update UI
    positionSquarePointer();
    updateColorFromHsv();
    updateAllInputs();
  }

  function stopSquareDrag() {
    window.removeEventListener('mousemove', handleSquareDrag);
    window.removeEventListener('mouseup', stopSquareDrag);
  }

  function positionSquarePointer() {
    const xPercent = currentColor.s / 100;
    const yPercent = 1 - currentColor.v / 100; // Invert Y axis
    
    squarePointer.style.left = `${xPercent * 100}%`;
    squarePointer.style.top = `${yPercent * 100}%`;
  }

  // Update background of the color square based on selected hue
  function updateColorSquareBackground() {
    const hueColor = `hsl(${currentColor.h}, 100%, 50%)`;
    colorSquare.style.background = `
      linear-gradient(to right, white, ${hueColor}),
      linear-gradient(to top, black, transparent)
    `;
    colorSquare.style.backgroundBlendMode = 'multiply';
  }

  // Update the hue slider's background
  function updateHueSliderBackground() {
    // No need to update as the gradient is set in CSS
  }

  // 修改handleOpacityChange，确保透明度为两位小数
  function handleOpacityChange() {
    currentColor.a = parseFloat((opacitySlider.value / 100).toFixed(2));
    updateColorFromHsv();
    updateAllInputs();
  }

  // Update color preview and all input fields
  function updateColorFromHsv() {
    const rgbaColor = hsvToRgba(
      currentColor.h,
      currentColor.s,
      currentColor.v,
      currentColor.a
    );
    
    // Update color preview
    colorPreview.style.backgroundColor = `rgba(${rgbaColor.join(',')})`;
    
    // Add current color to history
    addToColorHistory();
  }

  // 修改updateAllInputs函数，确保透明度信息显示为两位小数
  function updateAllInputs() {
    // 计算rgba值
    const rgba = hsvToRgba(
      currentColor.h,
      currentColor.s,
      currentColor.v,
      currentColor.a
    );
    
    // Update HEX input - 确保透明度信息正确传递
    hexInput.value = rgbaToHex(rgba);
    
    // 格式化透明度为两位小数
    const formattedAlpha = currentColor.a.toFixed(2);
    
    // Update RGBA input - 保持RGB为整数，透明度为两位小数
    rgbaInput.value = `${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${formattedAlpha}`;
    
    // Update HSL input
    const hsl = hsvToHsl(
      currentColor.h,
      currentColor.s,
      currentColor.v
    );
    hslInput.value = `${Math.round(hsl[0])}, ${Math.round(hsl[1])}%, ${Math.round(hsl[2])}%, ${formattedAlpha}`;
    
    // Update HSV input
    hsvInput.value = `${Math.round(currentColor.h)}, ${Math.round(currentColor.s)}%, ${Math.round(currentColor.v)}%, ${formattedAlpha}`;
    
    // Update CMYK input - CMYK不包含透明度信息
    const cmyk = rgbToCmyk(rgba[0], rgba[1], rgba[2]);
    cmykInput.value = `${Math.round(cmyk[0])}%, ${Math.round(cmyk[1])}%, ${Math.round(cmyk[2])}%, ${Math.round(cmyk[3])}%`;
  }

  // Apply color from input fields
  function applyColorFromInput(type) {
    switch(type) {
      case 'hex':
        applyHexColor();
        break;
      case 'rgba':
        applyRgbaColor();
        break;
      case 'hsl':
        applyHslColor();
        break;
      case 'hsv':
        applyHsvColor();
        break;
      case 'cmyk':
        applyCmykColor();
        break;
    }
    
    // Update UI
    updateHueSliderBackground();
    updateColorSquareBackground();
    positionHuePointer();
    positionSquarePointer();
    updateColorFromHsv();
    updateAllInputs();
  }

  function applyHexColor() {
    // Implementation of applying hex color
    const hex = hexInput.value.trim();
    const hexValue = hex.replace(/^#/, '');
    
    // 验证HEX格式
    if (!isValidHexFormat(hexValue)) {
      showHexInputError();
      return; // 如果格式不正确，不应用颜色更改
    }
    
    // 移除错误状态
    removeHexInputError();
    
    // 检测并更新HEX格式
    if (hexValue.length === 3 || hexValue.length === 4) {
      hexFormat = 'short';
    } else {
      hexFormat = 'long';
    }
    
    const rgba = hexToRgba(hex);
    const hsv = rgbaToHsv(rgba[0], rgba[1], rgba[2], rgba[3]);
    
    currentColor.h = hsv[0];
    currentColor.s = hsv[1];
    currentColor.v = hsv[2];
    currentColor.a = hsv[3];
    
    opacitySlider.value = currentColor.a * 100;
  }

  // 修改applyColorFromInput中透明度解析，确保保存为数值
  function applyRgbaColor() {
    // Implementation of applying RGBA color
    const values = rgbaInput.value.trim().split(',').map(v => parseFloat(v.trim()));
    if (values.length >= 3) {
      const hsv = rgbaToHsv(values[0], values[1], values[2], values[3] || 1);
      
      currentColor.h = hsv[0];
      currentColor.s = hsv[1];
      currentColor.v = hsv[2];
      currentColor.a = parseFloat(hsv[3].toFixed(2)); // 保证透明度为两位小数
      
      opacitySlider.value = currentColor.a * 100;
    }
  }

  function applyHslColor() {
    // Implementation of applying HSL color
    const values = hslInput.value.trim().split(',').map(v => 
      parseFloat(v.trim().replace('%', ''))
    );
    
    if (values.length >= 3) {
      const hsv = hslToHsv(values[0], values[1], values[2]);
      
      currentColor.h = hsv[0];
      currentColor.s = hsv[1];
      currentColor.v = hsv[2];
      currentColor.a = values[3] !== undefined ? parseFloat(values[3].toFixed(2)) : 1;
      
      opacitySlider.value = currentColor.a * 100;
    }
  }

  function applyHsvColor() {
    // Implementation of applying HSV color
    const values = hsvInput.value.trim().split(',').map(v => 
      parseFloat(v.trim().replace('%', ''))
    );
    
    if (values.length >= 3) {
      currentColor.h = values[0];
      currentColor.s = values[1];
      currentColor.v = values[2];
      currentColor.a = values[3] !== undefined ? parseFloat(values[3].toFixed(2)) : 1;
      
      opacitySlider.value = currentColor.a * 100;
    }
  }

  function applyCmykColor() {
    // Implementation of applying CMYK color
    const values = cmykInput.value.trim().split(',').map(v => 
      parseFloat(v.trim().replace('%', ''))
    );
    
    if (values.length >= 4) {
      const rgb = cmykToRgb(values[0], values[1], values[2], values[3]);
      const hsv = rgbaToHsv(rgb[0], rgb[1], rgb[2], 1);
      
      currentColor.h = hsv[0];
      currentColor.s = hsv[1];
      currentColor.v = hsv[2];
      // Keep existing alpha
      
      opacitySlider.value = currentColor.a * 100;
    }
  }

  // Color conversion functions
  function hsvToRgba(h, s, v, a = 1) {
    let r, g, b;
    
    s /= 100;
    v /= 100;
    
    const hi = Math.floor(h / 60) % 6;
    const f = h / 60 - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (hi) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    
    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
      a
    ];
  }

  function rgbaToHsv(r, g, b, a = 1) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    
    return [
      h,
      s * 100,
      v * 100,
      a
    ];
  }

  function hsvToHsl(h, s, v) {
    s /= 100;
    v /= 100;
    
    const l = v - v * s / 2;
    const ns = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
    
    return [h, ns * 100, l * 100];
  }

  function hslToHsv(h, s, l) {
    s /= 100;
    l /= 100;
    
    const v = l + s * Math.min(l, 1 - l);
    const sv = v === 0 ? 0 : 2 * (1 - l / v);
    
    return [h, sv * 100, v * 100];
  }

  function rgbaToHex(rgba) {
    const r = Math.round(rgba[0]);
    const g = Math.round(rgba[1]);
    const b = Math.round(rgba[2]);
    const a = rgba[3];

    // 检查是否可以使用短格式 (如果R,G,B的十六进制值的两位数字相同)
    const canBeShort = 
      (r % 17 === 0 && g % 17 === 0 && b % 17 === 0) && // 确保可以用单个十六进制数字表示
      (r < 256 && g < 256 && b < 256); // 确保在有效范围内
    
    // 检查是否有透明度信息
    const hasAlpha = a < 1;
    
    // 如果用户之前使用的是短格式
    if (hexFormat === 'short' && canBeShort) {
      if (hasAlpha) {
        // 如果有透明度，使用4位格式 (#RGBA)
        const alphaHex = Math.round(a * 15).toString(16);
        return `#${(r / 17).toString(16)}${(g / 17).toString(16)}${(b / 17).toString(16)}${alphaHex}`;
      } else {
        // 如果没有透明度，使用3位格式 (#RGB)
        return `#${(r / 17).toString(16)}${(g / 17).toString(16)}${(b / 17).toString(16)}`;
      }
    }
    
    // 使用长格式
    if (hasAlpha) {
      // 如果有透明度，使用8位格式 (#RRGGBBAA)
      const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alphaHex}`;
    } else {
      // 如果没有透明度，使用6位格式 (#RRGGBB)
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }

  function hexToRgba(hex) {
    let r, g, b, a = 1;
    
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
    // 验证HEX格式
    if (!isValidHexFormat(hex)) {
      return [0, 0, 0, 1]; // 返回默认黑色
    }
    
    // Handle shorthand hex
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } 
    // Handle shorthand hex with alpha
    else if (hex.length === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      a = parseInt(hex[3] + hex[3], 16) / 255;
    } 
    else {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
      
      // Handle alpha if present
      if (hex.length === 8) {
        a = parseInt(hex.substring(6, 8), 16) / 255;
      }
    }
    
    // 处理NaN情况，确保返回有效颜色值
    r = isNaN(r) ? 0 : r;
    g = isNaN(g) ? 0 : g;
    b = isNaN(b) ? 0 : b;
    a = isNaN(a) ? 1 : a;
    
    return [r, g, b, a];
  }

  function rgbToCmyk(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;
    
    return [c * 100, m * 100, y * 100, k * 100];
  }

  function cmykToRgb(c, m, y, k) {
    c /= 100;
    m /= 100;
    y /= 100;
    k /= 100;
    
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);
    
    return [Math.round(r), Math.round(g), Math.round(b)];
  }

  // Color history functions
  function addToColorHistory() {
    const rgbaColor = hsvToRgba(currentColor.h, currentColor.s, currentColor.v, currentColor.a);
    const hexColor = rgbaToHex(rgbaColor);
    
    // Don't add duplicates or if it's the same as the most recent color
    if (colorHistory.length > 0 && colorHistory[0] === hexColor) {
      return;
    }
    
    // Remove this color if it exists anywhere in the history
    colorHistory = colorHistory.filter(color => color !== hexColor);
    
    // Add to the beginning of the array
    colorHistory.unshift(hexColor);
    
    // Limit the history size
    if (colorHistory.length > maxHistoryItems) {
      colorHistory.pop();
    }
    
    // Update the display
    updateColorHistoryDisplay();
  }
  
  function updateColorHistoryDisplay() {
    const historySwatches = document.getElementById('historySwatches');
    historySwatches.innerHTML = '';
    
    colorHistory.forEach(hexColor => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch';
      swatch.style.backgroundColor = hexColor;
      swatch.title = hexColor;
      swatch.addEventListener('click', () => applyColorFromHistory(hexColor));
      historySwatches.appendChild(swatch);
    });
  }
  
  function applyColorFromHistory(hexColor) {
    hexInput.value = hexColor;
    applyHexColor();
    
    // Make the clicked color the most recent in history
    colorHistory = colorHistory.filter(color => color !== hexColor);
    colorHistory.unshift(hexColor);
    updateColorHistoryDisplay();
  }

  // 添加复制功能
  function copyColorValue(type, buttonElement) {
    let valueToCopy = '';
    
    switch(type) {
      case 'hex':
        valueToCopy = hexInput.value;
        break;
      case 'rgba':
        valueToCopy = `rgba(${rgbaInput.value})`;
        break;
      case 'hsl':
        valueToCopy = `hsl(${hslInput.value})`;
        break;
      case 'hsv':
        valueToCopy = `hsv(${hsvInput.value})`;
        break;
      case 'cmyk':
        valueToCopy = `cmyk(${cmykInput.value})`;
        break;
    }
    
    // 复制到剪贴板
    navigator.clipboard.writeText(valueToCopy).then(() => {
      // 显示复制成功反馈
      const originalText = buttonElement.textContent;
      buttonElement.textContent = '已复制!';
      buttonElement.classList.add('copy-success');
      
      // 2秒后恢复原始文本
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.classList.remove('copy-success');
      }, 2000);
    }).catch(err => {
      console.error('复制失败: ', err);
      // 显示复制失败反馈
      buttonElement.textContent = '复制失败';
      buttonElement.classList.add('copy-error');
      
      // 2秒后恢复原始文本
      setTimeout(() => {
        buttonElement.textContent = originalText;
        buttonElement.classList.remove('copy-error');
      }, 2000);
    });
  }
});
