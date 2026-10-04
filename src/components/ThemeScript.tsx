"use client";

import { useServerInsertedHTML } from "next/navigation";

/**
 * Injects the theme initialization script during SSR via Next.js's useServerInsertedHTML.
 * This runs outside the React client component tree, completely preventing the React 19
 * "Encountered a script tag while rendering React component" error while ensuring 0ms FOUC.
 */
export function ThemeScript() {
  useServerInsertedHTML(() => {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('stress_alpha_theme');var theme=(t==='light')?'light':'dark';document.documentElement.setAttribute('data-theme',theme);if(theme==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){}})()`,
        }}
      />
    );
  });

  return null;
}
