// The static host serves these pages from directories behind their public URLs.
export function isSlashlessPage(path) {
  return path !== '/' && path.startsWith('/') && !path.endsWith('/') && !path.split('/').at(-1).includes('.');
}

export function publicPagePath(path) {
  return path.replace(/\/+$/, '') || '/';
}
