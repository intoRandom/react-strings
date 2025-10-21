<h1 style="font-size:24px; color:#122121">
  <br>
  <a href="https://github.com/intoRandom/react-strings.git">
    react-strings
  </a>
  <br>
  <br>
</h1>

Keep your content organized, easy to update, and multilingual—built for React.

## Features

A lightweight solution for managing languages and preferences with ease.

- **Smart Autocomplete ⚡**  
  Instantly access the right information with intelligent, developer-friendly autocompletion.
- **Multi-Language Support 🗄️**  
  Manage single or multiple languages with a simple, centralized configuration.
- **Inline Tag Styling Support ✨**  
  Easily apply styles directly using standard HTML tags without any extra wrappers or CSS.<br>
  Our system supports the following tags: `b`, `i`, `u`, `small`, `sup`, `sub`.
- **Hook Factory Pattern for Safety & Segmentation 🛡️**  
  Reusable hooks with isolated state for safer and cleaner component logic.
- **Persistent User Preferences 🔒**  
  Automatically saves and restores the user’s language choice using `localStorage`.
- **No Extra Server Configuration 🙅🏻**  
  Ideal for apps with zero need for additional setup or configurations.
- **Fast & Simple Integration 🚀**  
  Install, configure, and start using in just a few minutes.
- **TypeScript Ready 🧩**  
  Fully typed brings safety, clarity, and scalability to your JavaScript code.

## What does it look like?

```jsx
// page.tsx

'use client';
import { useStrings } from '@/data/stringConfig';

export default function Home() {
  const { Str, Arr} = useStrings();
  const ver = '0.3.0';

  return (
  <>
    <StringsProvider>
      <h1>{Str.home.title()}</h1>
      <p>{Str.home.version({ version: ver })}</p>
      <ul>
        {Arr.home.features.map((obj, index) => (
          <li key={index}>
            <h2>{obj.item}</h2>
            <p>{obj.data}</p>
          </li>
        ))}
      </ul>
    </StringsProvider>
  );
}
```

```js
// en.json
{
	"title": "Welcome to {b{react-strings}}",
	"version": "Current version: {{version}}",
	"features": [
		{ "item": "Autocompletion", "data": "Remember keys" },
		{ "item": "Languages", "data": "Multi language support" },
		{ "item": "Identification", "data": "Browser & storage" }
	]
}
```

## Docs and demos

Just remember the guides themselves are the demos, source code available.

- **[Next js](https://intorandom.github.io/react-strings-next/)**
- **[React](https://intorandom.github.io/react-strings-react/)**

## Donations

It was fun (and sometimes very frustrating 😅) building this package! If you’d like to support its journey, a small donation goes a long way.

- **[Buy me a coffee](https://buymeacoffee.com/intorandom)**

Every spark makes the project shine brighter
