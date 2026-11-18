import { defineConfig } from 'astro/config';

// Static showcase site. No adapter, no server output: `npm run build`
// emits dist/ and `npm run preview` serves it locally.
export default defineConfig({
  output: 'static',
});
