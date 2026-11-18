// The static host serves these pages from directories behind their public URLs.
export function isSlashlessPage(path) {
  return path === '/analytics' || path === '/reports';
}

export function publicPagePath(path) {
  const slug = path.replace(/\/$/, '');
  return isSlashlessPage(slug) ? slug : path;
}
