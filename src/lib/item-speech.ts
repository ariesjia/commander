export function buildItemReadAloudText(input: {
  name: string;
  description: string;
  quantity: number;
}): string {
  const { name, description, quantity } = input;
  return `${name}。持有 ${quantity} 件。${description}`;
}
