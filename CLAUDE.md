# Color Converter Development Guide

## Project Overview
A simple web-based tool for converting between color formats (HEX, RGBA, HSL, HSV, CMYK).

## Running the Project
- Open `index.html` in a browser to run the application
- For development, use a local server: `python -m http.server` or `npx serve`

## Code Style Guidelines

### JavaScript
- Use camelCase for variable and function names
- Add comments for function descriptions and major code sections
- Use consistent indentation (2 spaces)
- Implement error handling with try/catch blocks
- Prefer arrow functions for callbacks where appropriate
- Use descriptive variable names that reflect their purpose
- Keep functions focused on a single responsibility
- Adopt defensive coding practices with input validation

### CSS
- Use descriptive class names following component-state-variant pattern
- Implement responsive design with media queries
- Group related properties together
- Document complex CSS with comments
- Mobile-first approach for media queries
- Prefer relative units (em, rem, %) over absolute ones (px)

### HTML
- Use semantic HTML elements
- Include proper accessibility attributes
- Maintain consistent indentation (2 spaces)
- Use UTF-8 character encoding