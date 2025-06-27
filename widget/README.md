# @usewayn/widget

A universal widget component for Wayn PoW (Proof of Work) CAPTCHA system that works with both vanilla HTML/JavaScript and React applications.

## Installation

### Via CDN (HTML/JavaScript)

```html
<!-- Load the widget from CDN -->
<script src="https://cdn.jsdelivr.net/npm/@usewayn/widget@latest/dist/wayn-widget.min.js"></script>

<!-- Use the custom element -->
<wayn-widget 
  api="https://wayn.tekir.co"
  color="light">
</wayn-widget>

<script>
// Listen for events
document.querySelector('wayn-widget').addEventListener('wayn:solve', (event) => {
  console.log('CAPTCHA solved, token:', event.detail.token);
});
</script>
```

### Via NPM (React/JavaScript)

```bash
npm install @usewayn/widget
```

## Usage

### HTML/JavaScript (Vanilla)

#### Method 1: Using Custom Element

```html
<!DOCTYPE html>
<html>
<head>
  <title>Wayn CAPTCHA Example</title>
</head>
<body>
  <form id="myForm">
    <input type="text" name="name" placeholder="Your name" required>
    
    <!-- Wayn Widget -->
    <wayn-widget 
      api="https://wayn.tekir.co"
      color="light"
      worker-count="4"
      data-i18n-initial-state="I'm a human"
      data-i18n-verifying="Verifying..."
      data-i18n-verified="You're a human"
      data-i18n-error="Error. Try again.">
    </wayn-widget>
    
    <button type="submit">Submit</button>
  </form>

  <script src="https://cdn.jsdelivr.net/npm/@usewayn/widget@latest/dist/wayn-widget.min.js"></script>
  <script>
    const widget = document.querySelector('wayn-widget');
    const form = document.getElementById('myForm');
    
    widget.addEventListener('wayn:solve', (event) => {
      console.log('CAPTCHA solved!', event.detail.token);
    });
    
    widget.addEventListener('wayn:error', (event) => {
      console.error('CAPTCHA error:', event.detail.error);
    });
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      if (!widget.isVerified) {
        alert('Please complete the CAPTCHA first');
        return;
      }
      
      // Submit form with token
      const formData = new FormData(form);
      console.log('Submitting with token:', widget.token);
      // ... submit logic
    });
  </script>
</body>
</html>
```

#### Method 2: Programmatic Usage

```html
<script src="https://cdn.jsdelivr.net/npm/@usewayn/widget@latest/dist/wayn-widget.min.js"></script>
<script>
  const wayn = new Wayn({
    api: 'https://wayn.tekir.co',
    color: 'dark',
    container: document.getElementById('captcha-container'),
    i18n: {
      initialState: "I'm a human",
      verifying: "Verifying...",
      verified: "You're a human",
      error: "Error. Try again."
    }
  });

  wayn.onSolve((token) => {
    console.log('CAPTCHA solved:', token);
  });

  wayn.onError((error) => {
    console.error('CAPTCHA error:', error);
  });
</script>
```

### React

```tsx
import { Widget } from '@usewayn/widget/react';

function MyForm() {
  const handleSolve = (token: string) => {
    console.log('CAPTCHA solved, token:', token);
    // Submit your form with the token
  };

  const handleError = (error: string) => {
    console.error('CAPTCHA error:', error);
  };

  return (
    <form>
      <input type="text" name="name" placeholder="Your name" required />
      
      <Widget
        api="https://wayn.tekir.co"
        color="light"
        onSolve={handleSolve}
        onError={handleError}
        onProgress={(progress) => console.log('Progress:', progress + '%')}
        i18n={{
          initialState: "I'm a human",
          verifying: "Verifying...",
          verified: "You're a human",
          error: "Error. Try again."
        }}
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Next.js (with SSR)

```tsx
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues
const Widget = dynamic(
  () => import('@usewayn/widget/react').then(mod => mod.Widget),
  { ssr: false }
);

export default function ContactForm() {
  return (
    <form>
      <Widget api="https://wayn.tekir.co" />
    </form>
  );
}
```

## API Reference

### HTML Attributes (Custom Element)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `api` | `string` | **Required** | API endpoint for the @usewayn/server provider |
| `color` | `'light' \| 'dark'` | `'light'` | Theme mode for the widget |
| `worker-count` | `number` | `navigator.hardwareConcurrency \|\| 4` | Number of workers to use for PoW solving |
| `disabled` | `boolean` | `false` | Whether the widget is disabled |
| `data-i18n-initial-state` | `string` | `"I'm a human"` | Custom text for initial state |
| `data-i18n-verifying` | `string` | `"Verifying..."` | Custom text for verifying state |
| `data-i18n-verified` | `string` | `"You're a human"` | Custom text for verified state |
| `data-i18n-error` | `string` | `"Error. Try again."` | Custom text for error state |

### React Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `api` | `string` | **Required** | API endpoint for the @usewayn/server provider |
| `color` | `'light' \| 'dark'` | `'light'` | Theme mode for the widget |
| `workerCount` | `number` | `navigator.hardwareConcurrency \|\| 4` | Number of workers to use for PoW solving |
| `onSolve` | `(token: string) => void` | `undefined` | Callback fired when the CAPTCHA is successfully solved |
| `onProgress` | `(progress: number) => void` | `undefined` | Callback fired during solving progress (0-100) |
| `onError` | `(error: string) => void` | `undefined` | Callback fired when an error occurs |
| `onReset` | `() => void` | `undefined` | Callback fired when the widget is reset |
| `className` | `string` | `''` | Custom CSS class name |
| `style` | `React.CSSProperties` | `undefined` | Custom styles |
| `disabled` | `boolean` | `false` | Whether the widget is disabled |
| `i18n` | `object` | `{}` | Custom internationalization texts |

### Events (Custom Element)

| Event | Detail | Description |
|-------|--------|-------------|
| `wayn:solve` | `{ token: string }` | Fired when CAPTCHA is successfully solved |
| `wayn:progress` | `{ progress: number }` | Fired during solving progress |
| `wayn:error` | `{ error: string }` | Fired when an error occurs |
| `wayn:reset` | `{}` | Fired when the widget is reset |

### JavaScript API

#### Properties

- `widget.token: string | null` - Current token value
- `widget.isVerified: boolean` - Whether the CAPTCHA is verified

#### Methods

- `widget.resetWidget(): void` - Reset the widget to initial state

## CSS Customization

The widget uses CSS custom properties (variables) for easy theming:

```css
wayn-widget {
  --wayn-background: #fdfdfd;
  --wayn-border-color: #dddddd8f;
  --wayn-border-radius: 14px;
  --wayn-color: #212121;
  --wayn-checkbox-size: 25px;
  --wayn-widget-width: 230px;
  --wayn-widget-height: 30px;
  /* ... and more */
}
```

### Dark Theme

```css
wayn-widget[color="dark"] {
  --wayn-background: #2d2d2d;
  --wayn-border-color: #4a4a4a;
  --wayn-color: #ffffff;
  /* ... and more */
}
```

## Server Integration

This widget is designed to work with `@usewayn/server`. Make sure your server endpoints match the expected API:

- `POST /challenge` - Get a new challenge
- `POST /verify` - Verify the solution

Expected API responses:

```typescript
// Challenge response
{
  challenge: Array<{ salt: string; target: number }>;
  token: string;
}

// Verify response
{
  success: boolean;
  token: string;
  expires: string;
}
```

## CDN URLs

- **Latest**: `https://cdn.jsdelivr.net/npm/@usewayn/widget@latest/dist/wayn-widget.min.js`
- **Specific version**: `https://cdn.jsdelivr.net/npm/@usewayn/widget@0.0.1/dist/wayn-widget.min.js`
- **ES Module**: `https://cdn.jsdelivr.net/npm/@usewayn/widget@latest/dist/wayn-widget.esm.js`

## TypeScript Support

The package includes full TypeScript definitions for both vanilla JavaScript and React usage.

## Browser Support

- Modern browsers with Web Workers support
- Custom Elements v1 support
- ES2020+ features
- React 16.8+ (for React integration)

## License

AGPL-3.0 - see LICENSE file for details.
