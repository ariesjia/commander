/** 与 GET /api/student/items 返回的 item 字段一致 */
export type ItemKindDto = "DISPLAY" | "MATERIAL" | "CONSUMABLE";

export interface StudentInventoryItemDto {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  kind: ItemKindDto;
}

/** 单条库存行（含数量） */
export interface StudentItemRow {
  item: StudentInventoryItemDto;
  quantity: number;
}

export interface StudentItemsResponse {
  items: StudentItemRow[];
}
