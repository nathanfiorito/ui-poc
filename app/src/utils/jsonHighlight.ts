export function highlightJson(json: string): string {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'text-violet-400';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-blue-400' : 'text-green-400';
      } else if (/true|false|null/.test(match)) {
        cls = 'text-amber-400';
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}
