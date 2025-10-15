import { toPng } from 'html-to-image';

export async function copyAndDownloadNodeAsPng(
  node: HTMLElement,
  options?: { filename?: string; pixelRatio?: number; backgroundColor?: string }
): Promise<string> {
  const filename = options?.filename ?? 'spaceview.png';
  const pixelRatio = options?.pixelRatio ?? Math.min(2, window.devicePixelRatio || 1);
  const backgroundColor = options?.backgroundColor ?? '#000';

  const waitTwoFrames = async () =>
    new Promise<void>(res =>
      requestAnimationFrame(() => requestAnimationFrame(() => res()))
    );

  if (!document.hasFocus()) {
    window.focus?.();
    await new Promise(r => setTimeout(r, 0));
  }

  await waitTwoFrames();
  const dataUrl = await toPng(node, { pixelRatio, backgroundColor } as any);

  // Best-effort: copy to clipboard
  const ClipboardItemAny = (window as any).ClipboardItem;
  if (navigator.clipboard?.write && ClipboardItemAny) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItemAny({ 'image/png': blob })]);
    } catch {
      // ignore clipboard failures
    }
  }

  // Always trigger a download
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  return dataUrl;
}