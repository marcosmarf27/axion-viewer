export const recuperabilidadeColors = {
  Alta: 'bg-[rgba(19,115,51,0.08)] text-[#137333]',
  Potencial: 'bg-[rgba(176,96,0,0.08)] text-[#b06000]',
  Critica: 'bg-[#fff3e0] text-[#e65100]',
  Indefinida: 'bg-[rgba(95,99,104,0.08)] text-[#5f6368]',
  Nenhuma: 'bg-[rgba(197,34,31,0.08)] text-[#c5221f]',
};

export const teseColors = {
  NPL: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  RJ: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  Divida_Ativa: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
  Litigio: 'bg-[rgba(25,103,210,0.08)] text-[#1967d2]',
};

export function formatCurrency(value) {
  if (value == null) return '-';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}
