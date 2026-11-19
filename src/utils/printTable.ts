export type PrintableTable = 'receipts' | 'loans';

export const printTable = (table: PrintableTable) => {
  const printClass = `printing-${table}`;
  const pageStyle = document.createElement('style');
  pageStyle.textContent = '@page { size: landscape; }';
  const cleanup = () => {
    document.body.classList.remove(printClass);
    window.removeEventListener('afterprint', cleanup);
    pageStyle.remove();
  };

  document.body.classList.add(printClass);
  document.head.appendChild(pageStyle);
  window.addEventListener('afterprint', cleanup, { once: true });

  try {
    window.print();
  } catch (error) {
    cleanup();
    throw error;
  }
};
