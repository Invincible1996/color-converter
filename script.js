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

  // Current color state
  let currentColor = {
    h: 216,   // Hue: 0-360
    s: 100,   // Saturation: 0-100
    v: 100,   // Value: 0-100
    a: 1.0    // Alpha: 0-1
  };

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
    
    // Convert button events
    convertButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        applyColorFromInput(type);
      });
    });

    // 添加输入框的实时更新事件
    hexInput.addEventListener('input', debounce(() => applyColorFromInput('hex'), 300));
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

  // Opacity slider handler
  function handleOpacityChange() {
    currentColor.a = opacitySlider.value / 100;
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
  }

  function updateAllInputs() {
    // Update HEX input
    hexInput.value = rgbaToHex(hsvToRgba(
      currentColor.h,
      currentColor.s,
      currentColor.v,
      currentColor.a
    ));
    
    // Update RGBA input
    const rgba = hsvToRgba(
      currentColor.h,
      currentColor.s,
      currentColor.v,
      currentColor.a
    );
    rgbaInput.value = rgba.join(', ');
    
    // Update HSL input
    const hsl = hsvToHsl(
      currentColor.h,
      currentColor.s,
      currentColor.v
    );
    hslInput.value = `${Math.round(hsl[0])}, ${Math.round(hsl[1])}%, ${Math.round(hsl[2])}%, ${currentColor.a}`;
    
    // Update HSV input
    hsvInput.value = `${Math.round(currentColor.h)}, ${Math.round(currentColor.s)}%, ${Math.round(currentColor.v)}%, ${currentColor.a}`;
    
    // Update CMYK input
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
    const rgba = hexToRgba(hex);
    const hsv = rgbaToHsv(rgba[0], rgba[1], rgba[2], rgba[3]);
    
    currentColor.h = hsv[0];
    currentColor.s = hsv[1];
    currentColor.v = hsv[2];
    currentColor.a = hsv[3];
    
    opacitySlider.value = currentColor.a * 100;
  }

  function applyRgbaColor() {
    // Implementation of applying RGBA color
    const values = rgbaInput.value.trim().split(',').map(v => parseFloat(v.trim()));
    if (values.length >= 3) {
      const hsv = rgbaToHsv(values[0], values[1], values[2], values[3] || 1);
      
      currentColor.h = hsv[0];
      currentColor.s = hsv[1];
      currentColor.v = hsv[2];
      currentColor.a = hsv[3];
      
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
      currentColor.a = values[3] !== undefined ? values[3] : 1;
      
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
      currentColor.a = values[3] !== undefined ? values[3] : 1;
      
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
    return `#${rgba.slice(0, 3).map(v => {
      const hex = Math.round(v).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`;
  }

  function hexToRgba(hex) {
    let r, g, b, a = 1;
    
    // Remove # if present
    hex = hex.replace(/^#/, '');
    
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
});
